import asyncio
import os
from dotenv import load_dotenv
from typing import List, AsyncIterator, Optional, Sequence, cast
from urllib.parse import urljoin
from bs4 import BeautifulSoup, Tag, ResultSet
from bs4.element import PageElement, NavigableString
from playwright.async_api import async_playwright, Page, TimeoutError as PlaywrightTimeoutError, Browser, BrowserContext
from background.sources.shared import user_agent, get_browser_page

from background.logger import setup_logger
from db.models import Source
from models.document_details import DocumentDetails
from background.sources.document_stream import DocumentStream

load_dotenv()  # Loads environment variables from .env
logger = setup_logger()

site_url: str = "https://ucnet.universityofcalifornia.edu"
base_url: str = "https://ucnet.universityofcalifornia.edu/resources/employment-policies-contracts/bargaining-units/"

# Helper class representing union details.


class UnionDetail:
    def __init__(self, name: str, code: str, url: str, scope: str) -> None:
        self.name: str = name
        self.code: str = code
        self.url: str = url
        # If URL is relative, prepend the site URL.
        if not url.startswith("http"):
            self.url = f"{site_url}{url}"
        self.scope: str = scope  # Either "ucop" or the name of the campus

    def __repr__(self) -> str:
        return f"UnionDetail(name={self.name}, code={self.code}, url={self.url}, scope={self.scope})"


class UcopCollectiveBargainingStream(DocumentStream):
    def __init__(self, source: Source) -> None:
        super().__init__(source)
        self.max_retries: int = 3

    async def get_local_unions(self, url: str, page: Page) -> List[UnionDetail]:
        """Retrieve local union details from the provided URL."""
        await page.goto(url)
        try:
            await page.wait_for_selector("#local", timeout=10000)
        except PlaywrightTimeoutError as e:
            logger.error(f"Error waiting for local unions page to load: {e}")
            raise e

        soup: BeautifulSoup = BeautifulSoup(await page.content(), "html.parser")
        union_details: List[UnionDetail] = []
        accordion_items: Sequence[Tag] = cast(
            Sequence[Tag],
            soup.find_all(
                "div", attrs={"class": "wp-block-ns-accordion__item"})
        )
        for item in accordion_items:
            button_elem = cast(Optional[Tag], item.find(
                "button", attrs={"class": "wp-block-ns-accordion__item-toggle"}))
            campus: str = button_elem.get_text(
                strip=True) if button_elem else "Unknown"
            links: Sequence[Tag] = cast(Sequence[Tag], item.find_all("a"))
            for a_tag in links:
                href = a_tag.get("href")
                link_text: str = cast(str, a_tag.get_text(strip=True))
                if href and isinstance(href, str) and "—" in link_text:
                    name, code = link_text.split("—")
                    union_detail = UnionDetail(
                        name=name.strip(),
                        code=code.strip(),
                        url=href,
                        scope=campus
                    )
                    union_details.append(union_detail)
        return union_details

    async def get_systemwide_unions(self, url: str, page: Page) -> List[UnionDetail]:
        """Retrieve systemwide union details from the provided URL."""
        await page.goto(url)
        try:
            await page.wait_for_selector("#systemwide", timeout=10000)
        except PlaywrightTimeoutError as e:
            logger.error(
                f"Error waiting for systemwide unions page to load: {e}")
            raise e

        soup: BeautifulSoup = BeautifulSoup(await page.content(), "html.parser")
        union_details: List[UnionDetail] = []
        a_tags: Sequence[Tag] = cast(
            Sequence[Tag],
            soup.find_all("a", attrs={"href": True})
        )
        for a_tag in a_tags:
            href = a_tag.get("href")
            scope: str = "ucop"
            span_tags: Sequence[Tag] = cast(
                Sequence[Tag], a_tag.find_all("span"))
            full_text: str = ""
            if span_tags:
                full_text = cast(str, span_tags[0].get_text(strip=True))
            if href and isinstance(href, str) and "—" in full_text:
                name, code = full_text.split("—")
                union_detail = UnionDetail(
                    name=name.strip(),
                    code=code.strip(),
                    url=href,
                    scope=scope
                )
                union_details.append(union_detail)
        return union_details

    async def get_local_union_contracts(self, unions: List[UnionDetail], page: Page) -> List[DocumentDetails]:
        """
        For each local union, navigate to its URL and extract contract links as PolicyDetails.
        """
        policy_details_list: List[DocumentDetails] = []
        for union in unions:
            await page.goto(union.url)
            try:
                await page.wait_for_selector("#content-detail__content", timeout=10000)
            except PlaywrightTimeoutError as e:
                logger.error(
                    f"Error waiting for contract detail page for union {union.name}: {e}")
                continue

            soup: BeautifulSoup = BeautifulSoup(await page.content(), "html.parser")
            content_detail = cast(Optional[Tag], soup.find(
                id="content-detail__content"))
            if content_detail:
                a_tags: Sequence[Tag] = cast(
                    Sequence[Tag],
                    content_detail.find_all("a", attrs={"href": True})
                )
                for a_tag in a_tags:
                    href = cast(Optional[str], a_tag.get("href"))
                    if href and isinstance(href, str) and href.endswith(".pdf"):
                        title: str = href.split("/")[-1].replace(".pdf", "")
                        policy_detail = DocumentDetails(
                            title=title,
                            url=href,
                            metadata={
                                "keywords": [union.code, union.name, union.scope],
                                "subject_areas": ["Collective Bargaining", union.code],
                                "responsible_office": union.scope
                            }
                        )
                        policy_details_list.append(policy_detail)
        return policy_details_list

    async def get_systemwide_union_contracts(self, unions: List[UnionDetail], page: Page) -> List[DocumentDetails]:
        """
        For each systemwide union, navigate to its contract page and extract contract links as PolicyDetails.
        """
        policy_details_list: List[DocumentDetails] = []
        for union in unions:
            contract_url: str = f"{union.url}/contract/"
            await page.goto(contract_url)
            try:
                await page.wait_for_selector("#content-detail__content", timeout=10000)
            except PlaywrightTimeoutError as e:
                logger.error(
                    f"Error waiting for contract detail page for union {union.name}: {e}")
                continue

            soup: BeautifulSoup = BeautifulSoup(await page.content(), "html.parser")
            content_detail = cast(Optional[Tag], soup.find(
                id="content-detail__content"))
            if content_detail:
                a_tags: Sequence[Tag] = cast(
                    Sequence[Tag],
                    content_detail.find_all("a", attrs={"href": True})
                )
                for a_tag in a_tags:
                    href = cast(Optional[str], a_tag.get("href"))
                    if href and isinstance(href, str) and href.endswith(".pdf"):
                        title: str = href.split("/")[-1].replace(".pdf", "")
                        policy_detail = DocumentDetails(
                            title=title,
                            url=href,
                            metadata={
                                "keywords": [union.code, union.name, union.scope],
                                "subject_areas": ["Collective Bargaining", union.code],
                                "responsible_office": union.scope
                            }
                        )
                        policy_details_list.append(policy_detail)
        return policy_details_list

    async def get_uc_collective_bargaining_links(self, page: Page) -> List[DocumentDetails]:
        """
        Combines local and systemwide union contracts into a single list of PolicyDetails.
        """
        home_url: str = base_url
        local_unions: List[UnionDetail] = await self.get_local_unions(home_url, page)
        systemwide_unions: List[UnionDetail] = await self.get_systemwide_unions(home_url, page)
        policy_details: List[DocumentDetails] = []
        policy_details += await self.get_local_union_contracts(local_unions, page)
        policy_details += await self.get_systemwide_union_contracts(systemwide_unions, page)
        return policy_details

    async def __aiter__(self) -> AsyncIterator[DocumentDetails]:
        """
        Asynchronously iterate over the collective bargaining contracts.
        Launches the browser, navigates to the UCOP Collective Bargaining page,
        retrieves union details and contracts, and yields each contract as a PolicyDetails object.
        """
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=False)
            context = await browser.new_context(user_agent=user_agent)
            page: Page = await context.new_page()

            policy_links: List[DocumentDetails] = await self.get_uc_collective_bargaining_links(page)
            for policy in policy_links:
                yield policy

            await browser.close()


if __name__ == "__main__":
    source = Source(
        name="UCCONTRACTS",
        url="https://ucnet.universityofcalifornia.edu/resources/employment-policies-contracts/bargaining-units/",
        last_updated=None,
        type="UCCONTRACTS")

    async def main():
        async for doc in UcopCollectiveBargainingStream(source):
            print(doc)
            print(doc.metadata)

    asyncio.run(main())
