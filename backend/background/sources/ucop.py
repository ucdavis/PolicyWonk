import asyncio
from datetime import datetime
import re
from typing import AsyncIterator
from urllib.parse import urljoin, urlsplit

from background.logger import setup_logger
from background.sources.document_stream import DocumentStream
from background.sources.shared import request_with_retry
from db.models import Source
from models.document_details import DocumentDetails

logger = setup_logger()

BASE_URL = "https://policy.ucop.edu"
LISTING_URL = (
    "https://policyapi.ucop.edu/php-app/"
    "?action=welcome&op=browse&api=1&p=1&all=1"
)


class UcopListingError(ValueError):
    """UCOP did not return a complete, usable policy listing."""


def _document_from_record(record: object, position: int) -> DocumentDetails:
    context = f"UCOP listing record {position}"
    if not isinstance(record, dict):
        raise UcopListingError(f"{context} must be an object")

    for field in ("title", "url", "responsibleOffice"):
        if not isinstance(record.get(field), str):
            raise UcopListingError(f"{context} has invalid {field}")
    if not record["title"].strip() or not record["url"].strip():
        raise UcopListingError(f"{context} has an empty title or URL")

    # Resolve document identity against the policy site, never the API host.
    url = urljoin(BASE_URL, record["url"].strip())
    parsed = urlsplit(url)
    if (
        parsed.scheme != "https"
        or parsed.netloc != "policy.ucop.edu"
        or not re.fullmatch(r"/doc/[0-9]+", parsed.path)
        or parsed.query
        or parsed.fragment
    ):
        raise UcopListingError(f"{context} has an unsupported document URL")

    subject_areas = record.get("subjectAreas")
    if not isinstance(subject_areas, list) or any(
        not isinstance(area, str) or not area.strip() for area in subject_areas
    ):
        raise UcopListingError(f"{context} has invalid subjectAreas")

    for field in ("effectiveDate", "issuanceDate"):
        if field not in record or (
            record[field] is not None and not isinstance(record[field], str)
        ):
            raise UcopListingError(f"{context} has invalid {field}")

    return DocumentDetails(
        title=record["title"].strip(),
        url=url,
        description="",
        content="",
        last_modified=datetime.now().isoformat(),
        metadata={
            "subject_areas": [area.strip() for area in subject_areas],
            "effective_date": (record["effectiveDate"] or "").strip(),
            "issuance_date": (record["issuanceDate"] or "").strip(),
            "responsible_office": record["responsibleOffice"].strip(),
            "classifications": ["Policy"],
        },
    )


def _parse_listing(payload: object) -> list[DocumentDetails]:
    if not isinstance(payload, dict):
        raise UcopListingError("UCOP listing must be an object")
    meta = payload.get("meta")
    records = payload.get("data")
    if not isinstance(meta, dict) or not isinstance(records, list):
        raise UcopListingError("UCOP listing requires meta and a data array")
    page_info = meta.get("page_info")
    if not isinstance(page_info, dict):
        raise UcopListingError("UCOP listing is missing page_info")
    if type(page_info.get("all_entries")) is not int or page_info["all_entries"] != 1:
        raise UcopListingError("UCOP listing did not return all entries")
    total = page_info.get("num_results")
    if type(total) is not int or total <= 0 or not records:
        raise UcopListingError("UCOP listing is empty or has an invalid total")
    if len(records) != total or meta.get("page_links") != []:
        raise UcopListingError(
            f"UCOP listing is incomplete: received {len(records)} of {total} records "
            "or pagination remains"
        )

    # Validate every record before the processor can download or write anything.
    documents = [
        _document_from_record(record, position)
        for position, record in enumerate(records, start=1)
    ]
    if len({doc.url for doc in documents}) != total:
        raise UcopListingError("UCOP listing contains duplicate document URLs")
    return documents


def _fetch_listing() -> list[DocumentDetails]:
    response = request_with_retry(
        LISTING_URL,
        retries=3,
        timeout=60,
        headers={"Accept": "application/json"},
        allow_redirects=False,
    )
    if response is None:
        raise UcopListingError("UCOP listing request failed after 3 attempts")
    with response:
        content_type = response.headers.get(
            "Content-Type", "").split(";", 1)[0].strip().lower()
        if content_type != "application/json":
            raise UcopListingError(
                "UCOP listing did not return application/json")
        try:
            payload = response.json()
        except ValueError:
            # Never include upstream response bodies in logs or stored errors.
            raise UcopListingError(
                "UCOP listing returned invalid JSON") from None
    return _parse_listing(payload)


class UcopDocumentStream(DocumentStream):
    async def __aiter__(self) -> AsyncIterator[DocumentDetails]:
        # UCOP is a fixed catalog. source.url remains descriptive, including the
        # retired advanced-search.php URLs already saved in existing databases.
        documents = await asyncio.to_thread(_fetch_listing)
        logger.info("Validated UCOP listing with %s policies", len(documents))
        for document in documents:
            yield document


if __name__ == "__main__":
    source = Source(
        name="UCOP",
        url="https://policy.ucop.edu/advanced-search.html?action=welcome&op=browse",
        last_updated=None,
        type="UCOP",
    )

    async def main():
        async for doc in UcopDocumentStream(source):
            print(doc)
            print(doc.metadata)

    asyncio.run(main())
