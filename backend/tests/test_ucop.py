"""Offline UCOP catalog contract tests, with HTTP mocked at the transport."""
import asyncio
from copy import deepcopy
from datetime import datetime
import json
from unittest.mock import Mock

import pytest
import requests

from background.sources import shared, ucop
from db.models import Source

LEGACY_URL = "https://policy.ucop.edu/advanced-search.php?action=welcome&op=browse&all=1"
API_URL = "https://policyapi.ucop.edu/php-app/?action=welcome&op=browse&api=1&p=1&all=1"


def listing():
    return {
        "meta": {"page_info": {"all_entries": 1, "num_results": 2}, "page_links": []},
        "data": [
            {
                "title": " Abusive Conduct in the Workplace ",
                "subjectAreas": ["Academic Affairs", " Human Resources "],
                "effectiveDate": "2025-06-23 00:00:00",
                "issuanceDate": "2025-07-10 00:00:00",
                "responsibleOffice": "HR - Human Resources",
                "url": "/doc/4000701",
            },
            {
                "title": "Another policy",
                "subjectAreas": [],
                "effectiveDate": None,
                "issuanceDate": None,
                "responsibleOffice": "",
                "url": "https://policy.ucop.edu/doc/4000702",
            },
        ],
    }


@pytest.fixture
def transport(monkeypatch):
    get = Mock()
    monkeypatch.setattr(shared.requests, "get", get)
    monkeypatch.setattr(shared.time, "sleep", lambda _: None)
    return get


def response(payload=None, *, status=200, content_type="application/json; charset=utf-8", body=None):
    result = requests.Response()
    result.status_code = status
    result.headers["Content-Type"] = content_type
    result._content = body if body is not None else json.dumps(
        payload).encode()
    result._content_consumed = True
    result.close = Mock(wraps=result.close)
    return result


def collect(source_url=LEGACY_URL):
    async def consume():
        return [doc async for doc in ucop.UcopDocumentStream(Source(name="UCOP", url=source_url))]
    return asyncio.run(consume())


@pytest.mark.parametrize("source_url", [
    LEGACY_URL,
    "https://policy.ucop.edu/advanced-search.html?action=welcome&op=browse",
    "https://untrusted.example/catalog?redirect=1",
])
def test_maps_complete_listing_and_uses_only_fixed_api(transport, source_url):
    reply = response(listing())
    transport.return_value = reply
    docs = collect(source_url)
    assert [doc.url for doc in docs] == [
        "https://policy.ucop.edu/doc/4000701", "https://policy.ucop.edu/doc/4000702",
    ]
    assert docs[0].title == "Abusive Conduct in the Workplace"
    assert docs[0].metadata == {
        "subject_areas": ["Academic Affairs", "Human Resources"],
        "effective_date": "2025-06-23 00:00:00",
        "issuance_date": "2025-07-10 00:00:00",
        "responsible_office": "HR - Human Resources",
        "classifications": ["Policy"],
    }
    assert docs[1].metadata["effective_date"] == ""
    assert docs[1].metadata["issuance_date"] == ""
    assert docs[1].metadata["subject_areas"] == []
    assert docs[0].content == docs[0].description == ""
    assert docs[0].direct_download_url is None
    datetime.fromisoformat(docs[0].last_modified)
    transport.assert_called_once_with(
        API_URL, timeout=60,
        headers={"Accept": "application/json",
                 "User-Agent": shared.user_agent},
        allow_redirects=False,
    )
    reply.close.assert_called_once()


@pytest.mark.parametrize("change", [
    lambda p: None,
    lambda p: [],
    lambda p: {"data": p["data"]},
    lambda p: {"meta": p["meta"]},
    lambda p: {**p, "data": {}},
    lambda p: {**p, "meta": {"page_info": None}},
    lambda p: {**p, "data": []},
    lambda p: {**p, "meta": {"page_info": {"all_entries": 1,
                                           "num_results": 0}, "page_links": []}, "data": []},
])
def test_rejects_invalid_or_empty_listing(transport, change):
    transport.return_value = response(change(listing()))
    with pytest.raises(ucop.UcopListingError):
        collect()


@pytest.mark.parametrize("field,value", [
    ("all_entries", 0), ("all_entries", "1"), ("all_entries", True),
    ("num_results", 3), ("num_results", 1), ("num_results", "2"),
    ("num_results", None), ("num_results", -1), ("num_results", True),
])
def test_rejects_incomplete_or_invalid_counts(transport, field, value):
    payload = listing()
    payload["meta"]["page_info"][field] = value
    transport.return_value = response(payload)
    with pytest.raises(ucop.UcopListingError):
        collect()


@pytest.mark.parametrize("links", [None, {}, ["?p=2"]])
def test_rejects_remaining_or_invalid_pagination(transport, links):
    payload = listing()
    payload["meta"]["page_links"] = links
    transport.return_value = response(payload)
    with pytest.raises(ucop.UcopListingError):
        collect()


@pytest.mark.parametrize("field,value", [
    ("title", " "), ("title", None), ("url", ""), ("url", 42),
    ("subjectAreas", "Human Resources"), ("subjectAreas", [None]),
    ("subjectAreas", [" "]), ("effectiveDate", []),
    ("issuanceDate", 42), ("responsibleOffice", None),
    ("url", "https://policyapi.ucop.edu/doc/123"),
    ("url", "//untrusted.example/doc/123"),
    ("url", "http://policy.ucop.edu/doc/123"),
    ("url", "https://user@policy.ucop.edu/doc/123"),
    ("url", "/advanced-search.php"), ("url", "/doc/123?redirect=1"),
    ("url", "/doc/123#fragment"),
])
def test_invalid_later_record_fails_before_yielding_any_document(transport, field, value):
    payload = listing()
    payload["data"][1][field] = value
    transport.return_value = response(payload)

    async def first_document():
        stream = ucop.UcopDocumentStream(Source(name="UCOP", url=LEGACY_URL))
        return await anext(aiter(stream))

    with pytest.raises(ucop.UcopListingError):
        asyncio.run(first_document())


@pytest.mark.parametrize("field", list(listing()["data"][0]))
def test_rejects_missing_record_fields(transport, field):
    payload = listing()
    del payload["data"][0][field]
    transport.return_value = response(payload)
    with pytest.raises(ucop.UcopListingError):
        collect()


def test_rejects_non_object_record(transport):
    payload = listing()
    payload["data"][1] = None
    transport.return_value = response(payload)
    with pytest.raises(ucop.UcopListingError, match="record 2 must be an object"):
        collect()


def test_rejects_duplicate_canonical_urls(transport):
    payload = listing()
    payload["data"][1]["url"] = "https://policy.ucop.edu/doc/4000701"
    transport.return_value = response(payload)
    with pytest.raises(ucop.UcopListingError, match="duplicate"):
        collect()


@pytest.mark.parametrize("content_type,body,error", [
    ("application/json", b"invalid json", "invalid JSON"),
    ("text/html", b"<html>upstream error</html>", "application/json"),
    ("application/octet-stream", b"not policy content", "application/json"),
])
def test_rejects_non_json_response_and_closes_it(transport, content_type, body, error):
    reply = response(content_type=content_type, body=body)
    transport.return_value = reply
    with pytest.raises(ucop.UcopListingError, match=error) as exc:
        collect()
    assert body.decode() not in str(exc.value)
    reply.close.assert_called_once()


@pytest.mark.parametrize("failure", [requests.Timeout("timeout"), requests.ConnectionError("offline"), 503, 404, 302])
def test_retries_transport_failures_then_raises(transport, failure):
    if isinstance(failure, Exception):
        transport.side_effect = failure
    else:
        transport.return_value = response(status=failure)
    with pytest.raises(ucop.UcopListingError, match="failed after 3 attempts"):
        collect()
    assert transport.call_count == 3
    if not isinstance(failure, Exception):
        assert transport.return_value.close.call_count == 3


def test_transient_failure_can_recover(transport):
    failed = response(status=503)
    transport.side_effect = [requests.Timeout(
        "timeout"), failed, response(deepcopy(listing()))]
    assert len(collect()) == 2
    assert transport.call_count == 3
    failed.close.assert_called_once()


@pytest.mark.parametrize("failure", ["empty", "incomplete", "timeout"])
def test_listing_failure_records_failed_attempt_without_advancing_refresh(
    transport, monkeypatch, failure,
):
    # Use the real dispatcher, processor, and update logic with an in-memory DB.
    # No downloader, embedding service, or search index should be reached.
    monkeypatch.setenv("USE_DEV_SETTINGS", "true")
    monkeypatch.setenv("ELASTIC_URL", "http://127.0.0.1:9200")
    monkeypatch.setenv("SENTRY_DSN", "")
    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import Session
    from background import stream, update
    from db.constants import IndexStatus, RefreshFrequency, SourceStatus, SourceType
    from db.models import IndexAttempt

    download = Mock(side_effect=AssertionError("Unexpected document download"))
    vectorize = Mock(side_effect=AssertionError("Unexpected vectorization"))
    monkeypatch.setattr(stream, "download_document", download)
    monkeypatch.setattr(stream, "vectorize_document", vectorize)
    if failure == "timeout":
        transport.side_effect = requests.Timeout("timeout")
    else:
        payload = listing()
        if failure == "empty":
            payload["data"] = []
            payload["meta"]["page_info"]["num_results"] = 0
        else:
            payload["data"].pop()
        transport.return_value = response(payload)

    engine = create_engine("sqlite:///:memory:")
    Source.__table__.create(engine)
    IndexAttempt.__table__.create(engine)
    previous_refresh = datetime(2026, 8, 18, 13, 23)
    try:
        with Session(engine) as session:
            source = Source(
                name="UCOP", url=LEGACY_URL, type=SourceType.UCOP,
                refresh_frequency=RefreshFrequency.DAILY, status=SourceStatus.ACTIVE,
                last_updated=previous_refresh, failure_count=2,
            )
            session.add(source)
            session.commit()
            asyncio.run(update.index_documents(session, source))
            session.expire_all()
            attempt = session.scalars(select(IndexAttempt)).one()
            assert attempt.status == IndexStatus.FAILURE
            assert "UcopListingError" in attempt.error_details
            assert attempt.end_time is not None
            assert attempt.num_docs_indexed == 0
            assert source.last_updated == previous_refresh
            assert source.failure_count == 3
            assert source.last_failed is not None
            assert source.status == SourceStatus.FAILED
            download.assert_not_called()
            vectorize.assert_not_called()
    finally:
        engine.dispose()
