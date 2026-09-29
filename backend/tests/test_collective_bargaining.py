"""Offline contract discovery regressions with HTTP mocked at the transport."""
import asyncio
from datetime import datetime
import json
from pathlib import Path
from unittest.mock import Mock
from xml.sax.saxutils import escape

import pytest
import requests

from background.sources import collective_bargaining as cb, shared
from db.models import Source

BASE = cb.BARGAINING_UNITS_URL
SV = BASE + "sv-student-services-and-advising-professionals/"
RP = BASE + "rp-research-and-public-service-professionals/"
CM = BASE + "cm-communications-marketing-and-sales-professionals/"
MR = BASE + "mr-medical-residents/"
K3 = BASE + "skilled-craft-davis/"
PAGE_MAP = cb.BASE_URL + "/page-sitemap.xml"
PDF_SV = cb.BASE_URL + "/wp-content/uploads/2026/09/UAW-SV-Complete-Contract.pdf"
PDF_RP = cb.BASE_URL + "/wp-content/uploads/2026/09/UAW-RP-Complete-Contract.pdf"


def xml(locations, *, index=False):
    root, entry = ("sitemapindex", "sitemap") if index else ("urlset", "url")
    return (f'<{root} xmlns="{cb.SITEMAP_NS[1:-1]}">'
            + "".join(f"<{entry}><loc>{escape(url)}</loc></{entry}>" for url in locations)
            + f"</{root}>")


def page(title, body):
    return f'<h1>{title}</h1><div id="content-detail__content">{body}</div>'


def listing(include_sv=True):
    links = [(RP, "RP — Research and Public Service Professionals"),
             (CM, "CM — Communications, Marketing and Sales Professionals"),
             (MR, "MR — Medical Residents")]
    if include_sv:
        links.append((SV, "SV — Student Services and Advising Professionals"))
    return page("Bargaining units, contracts and local agreements",
                '<h2>Systemwide bargaining units by union</h2><button>Union</button>'
                + "".join(f'<a href="{url}">{title}</a>' for url, title in links)
                + '<h2>Local agreements by location</h2><button>UC Davis</button>'
                + f'<a href="{K3}">K3 — Skilled Craft</a>')


def response(url, body, *, status=200, content_type=None):
    result = requests.Response()
    result.status_code = status
    result.url = url
    result.headers["Content-Type"] = content_type or (
        "text/xml; charset=UTF-8" if url.endswith(".xml") else "text/html; charset=UTF-8")
    result._content = body.encode() if isinstance(body, str) else body
    result._content_consumed = True
    return result


@pytest.fixture
def site(monkeypatch):
    pages = json.loads(
        (Path(__file__).parent / "fixtures/ucnet/pages.json").read_text())
    pages[PAGE_MAP] = xml(pages)
    pages[cb.SITEMAP_INDEX_URL] = xml([PAGE_MAP], index=True)
    pages[BASE] = listing()

    def get(url, **kwargs):
        assert kwargs["timeout"] == 30
        assert kwargs["allow_redirects"] is False
        value = pages[url]
        if isinstance(value, Exception):
            raise value
        if isinstance(value, requests.Response):
            return value
        return response(url, value)

    transport = Mock(side_effect=get)
    monkeypatch.setattr(shared.requests, "get", transport)
    monkeypatch.setattr(shared.time, "sleep", lambda _: None)
    return pages, transport


def collect(*, first_only=False):
    async def consume():
        stream = cb.UcnetCollectiveBargainingStream(
            Source(name="UC Contracts", url=BASE, type="UCCONTRACTS"))
        if first_only:
            return await anext(aiter(stream))
        return [doc async for doc in stream]
    return asyncio.run(consume())


def test_discovers_separate_contracts_and_direct_local_agreement(site):
    docs = collect()
    assert len(docs) == 3
    sv = next(doc for doc in docs if doc.url == PDF_SV)
    assert sv.title == "UAW-SV-Complete-Contract"
    assert sv.metadata == {
        "keywords": ["SV", "Student Services and Advising Professionals", "ucop"],
        "subject_areas": ["Collective Bargaining", "SV"], "responsible_office": "ucop",
        "bargaining_units": [{"code": "SV", "name": "Student Services and Advising Professionals", "campuses": ["all"]}],
    }
    assert PDF_RP in {doc.url for doc in docs}
    local = next(doc for doc in docs if "K3" in doc.metadata["keywords"])
    assert local.metadata["responsible_office"] == "UC Davis"
    assert local.metadata["keywords"] == ["K3", "Skilled Craft", "UC Davis"]
    assert all(not doc.content and doc.direct_download_url is None for doc in docs)
    assert any(call.args[0] == MR +
               "contract-mr/" for call in site[1].call_args_list)


def test_sitemap_discovers_unit_absent_from_main_listing(site):
    site[0][BASE] = listing(include_sv=False)
    assert PDF_SV in {doc.url for doc in collect()}


def test_split_sitemaps_ignore_news_and_unrelated_catalogs(site):
    pages, transport = site
    second = cb.BASE_URL + "/page-sitemap2.xml"
    ignored = [SV + "news/", SV + "about/",
               cb.BASE_URL + "/unrelated/contract/"]
    pages[PAGE_MAP] = xml([K3] + ignored)
    pages[second] = xml(
        [url for url in pages if cb._unit_root(url) and url != K3])
    pages[cb.SITEMAP_INDEX_URL] = xml(
        [PAGE_MAP, second, cb.BASE_URL + "/pdf-sitemap.xml"], index=True)
    assert len(collect()) == 3
    requested = {call.args[0] for call in transport.call_args_list}
    assert not requested.intersection(
        ignored + [cb.BASE_URL + "/pdf-sitemap.xml"])


def test_slashless_contract_tab_with_fragment_is_recognized(site):
    site[0][SV] = site[0][SV].replace(
        SV + "contract/", SV + "contract#content")
    assert PDF_SV in {doc.url for doc in collect()}


def test_uppercase_query_relative_and_duplicate_pdf_links_preserve_identity(site):
    site[0][SV + "contract/"] = page("SV — Student Services and Advising Professionals", '''
        <a href="/uploads/Agreement.PDF?download=1#page=2">Contract</a>
        <a href="/uploads/Agreement.PDF?download=1#page=3">Again</a>
        <a href="annex.pdf">Annex</a>
        <a href="https://campus.example/local.pdf">Local</a>''')
    docs = [d for d in collect() if "SV" in d.metadata["keywords"]]
    assert {d.url for d in docs} == {
        cb.BASE_URL + "/uploads/Agreement.PDF?download=1",
        SV + "contract/annex.pdf", "https://campus.example/local.pdf",
    }
    assert next(d for d in docs if "Agreement" in d.url).title == "Agreement"


def test_shared_pdf_is_yielded_once_with_all_unit_metadata(site):
    site[0][K3] = page("K3 — Skilled Craft",
                       f'<a href="{PDF_SV}">Shared agreement</a>')
    docs = collect()
    assert len(docs) == 2
    metadata = next(doc for doc in docs if doc.url == PDF_SV).metadata
    assert set(metadata["subject_areas"]) == {
        "Collective Bargaining", "K3", "SV"}
    assert set(metadata["keywords"]) == {
        "K3", "Skilled Craft", "UC Davis", "SV", "Student Services and Advising Professionals", "ucop",
    }
    assert metadata["bargaining_units"] == [
        {"code": "K3", "name": "Skilled Craft", "campuses": ["ucdavis"]},
        {"code": "SV", "name": "Student Services and Advising Professionals", "campuses": ["all"]},
    ]
    assert set(metadata["responsible_office"].split("; ")) == {
        "ucop", "UC Davis"}


@pytest.mark.parametrize("missing", [SV, K3, SV + "contract/"])
def test_incomplete_sitemap_fails_before_first_document(site, missing):
    pages, _ = site
    pages[PAGE_MAP] = xml(
        [url for url in pages if cb._unit_root(url) and url != missing])
    with pytest.raises(cb.UcnetListingError, match="missing from sitemap"):
        collect(first_only=True)


@pytest.mark.parametrize("url", [PAGE_MAP, cb.SITEMAP_INDEX_URL])
@pytest.mark.parametrize("body", ["not xml", "<html>Maintenance</html>", xml([]),
                                  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url/></urlset>'])
def test_invalid_or_empty_sitemap_fails_closed(site, url, body):
    site[0][url] = body
    with pytest.raises(cb.UcnetListingError):
        collect(first_only=True)


@pytest.mark.parametrize("url", [BASE, K3, SV + "contract/"])
def test_missing_page_structure_fails_closed(site, url):
    site[0][url] = "<h1>Maintenance</h1><p>Come back later</p>"
    with pytest.raises(cb.UcnetListingError, match="heading or content"):
        collect(first_only=True)


def test_unexplained_empty_contract_fails_even_if_home_has_pdf(site):
    site[0][SV] = page("SV — Student Services and Advising Professionals",
                       '<a href="https://example.org/flyer.pdf">Flyer</a>')
    site[0][SV + "contract/"] = page(
        "SV — Student Services and Advising Professionals", "Contract")
    with pytest.raises(cb.UcnetListingError, match="No PDFs"):
        collect(first_only=True)


def test_sidebar_pdf_cannot_mask_empty_contract_body(site):
    site[0][SV + "contract/"] = page("SV — Student Services and Advising Professionals",
                                     "Contract") + '<aside><a href="https://example.org/benefits.pdf">Benefits</a></aside>'
    with pytest.raises(cb.UcnetListingError, match="No PDFs"):
        collect(first_only=True)


@pytest.mark.parametrize("failure", [requests.Timeout("timeout"), 503, 404, 302])
def test_page_failure_retries_then_aborts_before_yield(site, failure):
    pages, transport = site
    url = SV + "contract/"
    pages[url] = failure if isinstance(
        failure, Exception) else response(url, "failed", status=failure)
    with pytest.raises(cb.UcnetListingError, match="failed after 3 attempts"):
        collect(first_only=True)
    assert sum(call.args[0] == url for call in transport.call_args_list) == 3


def test_transient_request_failure_recovers(site):
    _, transport = site
    original = transport.side_effect
    failed = False

    def get(url, **kwargs):
        nonlocal failed
        if url == PAGE_MAP and not failed:
            failed = True
            raise requests.Timeout("timeout")
        return original(url, **kwargs)

    transport.side_effect = get
    assert len(collect()) == 3


@pytest.mark.parametrize("url", [PAGE_MAP, SV + "contract/"])
def test_wrong_content_type_fails(site, url):
    site[0][url] = response(url, site[0][url], content_type="application/json")
    with pytest.raises(cb.UcnetListingError, match="content type"):
        collect(first_only=True)


def test_failure_does_not_advance_refresh_or_download_documents(site, monkeypatch):
    monkeypatch.setenv("USE_DEV_SETTINGS", "true")
    monkeypatch.setenv("ELASTIC_URL", "http://127.0.0.1:9200")
    monkeypatch.setenv("SENTRY_DSN", "")
    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import Session
    from background import stream, update
    from db.constants import IndexStatus, RefreshFrequency, SourceStatus, SourceType
    from db.models import IndexAttempt

    site[0][SV + "contract/"] = requests.Timeout("timeout")
    download = Mock(side_effect=AssertionError("Unexpected download"))
    vectorize = Mock(side_effect=AssertionError("Unexpected indexing"))
    monkeypatch.setattr(stream, "download_document", download)
    monkeypatch.setattr(stream, "vectorize_document", vectorize)
    engine = create_engine("sqlite:///:memory:")
    Source.__table__.create(engine)
    IndexAttempt.__table__.create(engine)
    previous = datetime(2026, 9, 27, 12)
    try:
        with Session(engine) as session:
            source = Source(name="UC Contracts", url=BASE, type=SourceType.UCCONTRACTS,
                            refresh_frequency=RefreshFrequency.DAILY, status=SourceStatus.ACTIVE,
                            last_updated=previous, failure_count=0)
            session.add(source)
            session.commit()
            asyncio.run(update.index_documents(session, source))
            session.expire_all()
            attempt = session.scalars(select(IndexAttempt)).one()
            assert attempt.status == IndexStatus.FAILURE
            assert "UcnetListingError" in attempt.error_details
            assert source.last_updated == previous
            assert source.failure_count == 1
            download.assert_not_called()
            vectorize.assert_not_called()
    finally:
        engine.dispose()


def test_sitemap_only_local_unit_uses_its_campus_label(site):
    pages, _ = site
    url = BASE + "new-local-unit/"
    pages[url] = page("KX — Skilled Craft", '<a href="/new-local.pdf">Contract</a>').replace(
        "<h1>", '<div class="wp-block-ns-section-header__eyebrow">UC DAVis</div><h1>')
    pages[PAGE_MAP] = xml([key for key in pages if cb._unit_root(key)])
    doc = next(d for d in collect() if d.url.endswith("/new-local.pdf"))
    assert doc.metadata["keywords"] == ["KX", "Skilled Craft", "UC Davis"]
    assert doc.metadata["responsible_office"] == "UC Davis"


def test_missing_local_section_fails_instead_of_losing_campus_metadata(site):
    site[0][BASE] = listing().replace(
        "Local agreements by location", "Unexpected heading")
    with pytest.raises(cb.UcnetListingError, match="Missing systemwide or local"):
        collect(first_only=True)


def test_wrong_unit_page_fails_instead_of_misattributing_contracts(site):
    site[0][SV] = page("XX — Another unit", "Contract")
    with pytest.raises(cb.UcnetListingError, match="Unit code disagrees"):
        collect(first_only=True)
