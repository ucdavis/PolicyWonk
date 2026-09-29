"""Discover UC contracts from UCnet's page sitemaps, without a browser."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
import re
from typing import AsyncIterator
from urllib.parse import urldefrag, urljoin, urlsplit
from xml.etree import ElementTree

from bs4 import BeautifulSoup, Tag

from background.logger import setup_logger
from background.sources.document_stream import DocumentStream
from background.sources.shared import request_with_retry
from db.models import Source
from models.document_details import DocumentDetails

logger = setup_logger()
BASE_URL = "https://ucnet.universityofcalifornia.edu"
BARGAINING_UNITS_URL = (
    f"{BASE_URL}/resources/employment-policies-contracts/bargaining-units/"
)
SITEMAP_INDEX_URL = f"{BASE_URL}/sitemap_index.xml"
SITEMAP_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
UNIT_TITLE = re.compile(r"^(\w+)\s+[—–-]\s+(.+)$")
# These are explicit publication states, not a blanket exemption for empty pages.
UNPUBLISHED_NOTICES = (
    "no collective bargaining agreement has yet been completed",
    "will be posted to this page once it is available",
)
# UCnet publication labels mapped to the app's campus identifiers. Unknown
# labels fail closed so a local agreement can never become systemwide.
CAMPUS_CODES = {
    "ucop": "all",
    "uc berkeley": "ucb", "uc davis": "ucdavis",
    "uc san francisco": "ucsf", "uc irvine": "uci",
    "ucla": "ucla", "uc los angeles": "ucla",
    "uc merced": "ucmerced", "uc riverside": "ucr",
    "uc san diego": "ucsd", "uc santa barbara": "ucsb",
    "uc santa cruz": "ucsc", "lawrence berkeley national laboratory": "lbl",
}


class UcnetListingError(ValueError):
    """UCnet did not return a complete, usable contract listing."""


@dataclass(frozen=True)
class Unit:
    code: str
    name: str
    office: str = "ucop"

    def metadata(self) -> dict:
        campus = CAMPUS_CODES.get(self.office.casefold())
        if campus is None:
            raise UcnetListingError(f"Unrecognized bargaining-unit campus: {self.office}")
        return {
            "keywords": [self.code, self.name, self.office],
            "subject_areas": ["Collective Bargaining", self.code],
            "responsible_office": self.office,
            "bargaining_units": [{
                "code": self.code.upper(), "name": self.name, "campuses": [campus],
            }],
        }


def _fetch(url: str, *, xml: bool = False) -> bytes:
    response = request_with_retry(
        url, retries=3, timeout=30, allow_redirects=False)
    if response is None:
        raise UcnetListingError(
            f"UCnet request failed after 3 attempts: {url}")
    with response:
        content_type = response.headers.get(
            "Content-Type", "").split(";", 1)[0].lower().strip()
        allowed = {"application/xml", "text/xml"} if xml else {"text/html"}
        if content_type not in allowed:
            raise UcnetListingError(
                f"Unexpected content type for {url}: {content_type}")
        return response.content


def _sitemap_locations(content: bytes, url: str, kind: str) -> list[str]:
    try:
        root = ElementTree.fromstring(content)
    except ElementTree.ParseError:
        raise UcnetListingError(f"Invalid sitemap XML: {url}") from None
    if root.tag != SITEMAP_NS + kind:
        raise UcnetListingError(f"Expected {kind} at {url}")
    entry_tag = "sitemap" if kind == "sitemapindex" else "url"
    entries = root.findall(SITEMAP_NS + entry_tag)
    locations = []
    for entry in entries:
        location = entry.findtext(SITEMAP_NS + "loc", "").strip()
        if not location:
            raise UcnetListingError(f"Missing sitemap location at {url}")
        locations.append(location)
    if not locations:
        raise UcnetListingError(f"Empty sitemap: {url}")
    return locations


def _unit_root(url: str) -> str | None:
    """Accept unit home pages and contract tabs, including contract-mr."""
    if not url.startswith(BARGAINING_UNITS_URL):
        return None
    parsed = urlsplit(url)
    if parsed.query or parsed.fragment:
        return None
    parts = url.removeprefix(BARGAINING_UNITS_URL).strip("/").split("/")
    if not parts[0] or len(parts) > 2:
        return None
    if len(parts) == 2 and not re.fullmatch(r"contract(?:-[a-z0-9-]+)?", parts[1]):
        return None
    return BARGAINING_UNITS_URL + parts[0] + "/"


def _page_url(url: str) -> str:
    # UCnet's navigation mixes slashless links and canonical trailing slashes.
    return urldefrag(url)[0].rstrip("/") + "/"


def _discover_pages() -> set[str]:
    index = _sitemap_locations(
        _fetch(SITEMAP_INDEX_URL, xml=True), SITEMAP_INDEX_URL, "sitemapindex")
    # Yoast splits large page catalogs into page-sitemap2.xml, etc.
    sitemaps = sorted({url for url in index if re.fullmatch(
        re.escape(BASE_URL) + r"/page-sitemap\d*\.xml", url
    )})
    if not sitemaps:
        raise UcnetListingError(
            "UCnet sitemap index contains no page sitemaps")
    pages = set()
    for url in sitemaps:
        locations = _sitemap_locations(_fetch(url, xml=True), url, "urlset")
        pages.update(_page_url(location)
                     for location in locations if _unit_root(location))
    if not pages:
        raise UcnetListingError(
            "UCnet page sitemaps contain no bargaining units")
    return pages


def _parse_page(content: bytes, url: str) -> tuple[BeautifulSoup, Tag]:
    soup = BeautifulSoup(content, "html.parser")
    body = soup.find(id="content-detail__content")
    if not soup.find("h1") or not isinstance(body, Tag):
        raise UcnetListingError(
            f"Missing UCnet page heading or content: {url}")
    return soup, body


def _listing_units(body: Tag) -> tuple[dict[str, Unit], set[str]]:
    """Keep existing names and campus metadata; discovery comes from sitemaps."""
    units = {}
    pages = set()
    section = None
    office = None
    sections_seen = set()
    for element in body.find_all(["h2", "button", "a"]):
        text = element.get_text(" ", strip=True)
        if element.name == "h2":
            section = text
            office = None
        elif element.name == "button":
            office = text
        elif section in {"Systemwide bargaining units by union", "Local agreements by location"}:
            href = urljoin(BARGAINING_UNITS_URL, element.get("href", ""))
            root = _unit_root(href)
            if not root or not text:
                continue
            match = UNIT_TITLE.fullmatch(text)
            if not match or not office:
                raise UcnetListingError(
                    f"Unrecognized bargaining unit in main listing: {text}")
            code, name = match.groups()
            unit = Unit(code, name, office if section ==
                        "Local agreements by location" else "ucop")
            if root in units and units[root] != unit:
                raise UcnetListingError(f"Conflicting unit metadata: {root}")
            units[root] = unit
            pages.add(_page_url(href))
            sections_seen.add(section)
    if len(sections_seen) != 2:
        raise UcnetListingError(
            "Missing systemwide or local units in main listing")
    return units, pages


def _page_unit(soup: BeautifulSoup, url: str) -> Unit:
    heading = soup.find("h1")
    match = UNIT_TITLE.fullmatch(heading.get_text(" ", strip=True))
    if not match:
        raise UcnetListingError(f"Missing unit code and name: {url}")
    # Local pages label their campus above the heading. This also supports units
    # published in the sitemap before they are added to the main listing.
    eyebrow = soup.select_one(".wp-block-ns-section-header__eyebrow")
    office = eyebrow.get_text(" ", strip=True) if eyebrow else "ucop"
    if office.casefold().startswith("uc "):
        office = "UC " + office[3:].title()
    elif office.casefold() == "ucla":
        office = "UCLA"
    return Unit(*match.groups(), office=office)


def _pdf_links(body: Tag, page_url: str) -> list[str]:
    links = []
    for anchor in body.select("a[href]"):
        url = urldefrag(urljoin(page_url, anchor["href"].strip()))[0]
        parsed = urlsplit(url)
        if parsed.scheme in {"http", "https"} and parsed.netloc and parsed.path.lower().endswith(".pdf"):
            links.append(url)
    return list(dict.fromkeys(links))


def _fetch_listing() -> list[DocumentDetails]:
    pages = _discover_pages()
    _, listing_body = _parse_page(
        _fetch(BARGAINING_UNITS_URL), BARGAINING_UNITS_URL)
    listed_units, listed_pages = _listing_units(listing_body)
    # Cross-check independent sources before yielding anything. A truncated
    # sitemap must not silently drop a unit still advertised on the main page.
    missing = (set(listed_units) | listed_pages) - pages
    if missing:
        raise UcnetListingError(
            f"Main listing pages missing from sitemap: {sorted(missing)}")
    roots = {_unit_root(url) for url in pages}
    if roots - pages:
        raise UcnetListingError(
            f"Unit home pages missing from sitemap: {sorted(roots - pages)}")

    def fetch_page(url):
        return url, _parse_page(_fetch(url), url)

    # All pages are fetched and validated before the first document is yielded.
    with ThreadPoolExecutor(max_workers=4) as pool:
        contents = dict(pool.map(fetch_page, sorted(pages)))
    documents = {}
    for root in sorted(roots):
        soup, home_body = contents[root]
        page_unit = _page_unit(soup, root)
        unit = listed_units.get(root, page_unit)
        if page_unit.code != unit.code:
            raise UcnetListingError(
                f"Unit code disagrees with main listing: {root}")
        contract_pages = {url for url in pages if _unit_root(
            url) == root and url != root}
        unit_pages = contract_pages | (listed_pages & {root})
        if not contract_pages:
            unit_pages.add(root)
        # Catch a new contract tab even if a sitemap response has omitted it.
        for anchor in home_body.select("a[href]"):
            href = _page_url(urljoin(root, anchor["href"]))
            if _unit_root(href) == root and href != root and href not in pages:
                raise UcnetListingError(
                    f"Contract tab missing from sitemap: {href}")

        unit_urls = []
        unpublished = False
        for url in sorted(unit_pages):
            _, body = contents[url]
            pdfs = _pdf_links(body, url)
            unit_urls.extend(pdfs)
            text = " ".join(body.stripped_strings).casefold()
            notice = any(notice in text for notice in UNPUBLISHED_NOTICES)
            if url != root and not pdfs and not notice:
                raise UcnetListingError(
                    f"No PDFs or unpublished-contract notice at {url}")
            unpublished |= notice
        if not unit_urls:
            if not unpublished:
                raise UcnetListingError(
                    f"No PDFs or unpublished-contract notice for {unit.code}: {root}")
            logger.info("No contract published yet for %s", unit.code)
        for url in dict.fromkeys(unit_urls):
            if url in documents:
                # Shared PDFs are downloaded once, retaining all unit keywords.
                existing = documents[url].metadata
                metadata = unit.metadata()
                for key in ("keywords", "subject_areas"):
                    existing[key] = list(dict.fromkeys(
                        existing[key] + metadata[key]))
                for association in metadata["bargaining_units"]:
                    if association not in existing["bargaining_units"]:
                        existing["bargaining_units"].append(association)
                offices = existing["responsible_office"].split("; ")
                if unit.office not in offices:
                    existing["responsible_office"] += "; " + unit.office
                continue
            title = re.sub(r"\.pdf$", "", urlsplit(
                url).path.rsplit("/", 1)[-1], flags=re.IGNORECASE)
            documents[url] = DocumentDetails(
                title=title, url=url, metadata=unit.metadata())
    if not documents:
        raise UcnetListingError("UCnet returned no contract PDFs")
    logger.info("Validated %s contract PDFs across %s units and %s pages", len(
        documents), len(roots), len(pages))
    return list(documents.values())


class UcnetCollectiveBargainingStream(DocumentStream):
    async def __aiter__(self) -> AsyncIterator[DocumentDetails]:
        # source.url is descriptive; use the fixed UCnet catalog as before.
        documents = await asyncio.to_thread(_fetch_listing)
        for document in documents:
            yield document


if __name__ == "__main__":
    source = Source(name="UCCONTRACTS",
                    url=BARGAINING_UNITS_URL, type="UCCONTRACTS")

    async def main():
        async for document in UcnetCollectiveBargainingStream(source):
            print(document)
            print(document.metadata)

    asyncio.run(main())
