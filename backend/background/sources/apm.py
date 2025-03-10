import asyncio
import logging
from typing import List, AsyncIterator
from urllib.parse import urljoin
from dotenv import load_dotenv
from bs4 import BeautifulSoup, Tag
from playwright.async_api import Page, TimeoutError as PlaywrightTimeoutError

from background.sources.document_stream import DocumentStream
from background.sources.shared import user_agent, get_browser_page
from db.models import Source
from models.document_details import DocumentDetails

load_dotenv()
logger = logging.getLogger(__name__)

base_url: str = "https://academicaffairs.ucdavis.edu/"


class UcdApmStream(DocumentStream):
    def __init__(self, source: Source) -> None:
        super().__init__(source)
        self.apm_url: str = self.get_apm_url()
        self.max_retries: int = 3

    def get_apm_url(self) -> str:
        """Return the URL for the APM table of contents."""
        return urljoin(base_url, "apm/apm-toc")

    async def get_apm_links(self, page: Page, url: str) -> List[DocumentDetails]:
        """
        Navigate to the given URL, wait for the main content to load, and then extract
        all PDF links from the content.
        """
        policy_link_info_list: List[DocumentDetails] = []
        await page.goto(url)
        try:
            await page.wait_for_selector("#block-sitefarm-one-content", timeout=10000)
        except PlaywrightTimeoutError as e:
            logger.error(f"Error waiting for page to load: {e}")
            raise e

        content_html: str = await page.content()
        soup: BeautifulSoup = BeautifulSoup(content_html, "html.parser")
        content_tag = soup.find(id="block-sitefarm-one-content")
        if not content_tag or not isinstance(content_tag, Tag):
            logger.error(
                "Could not find main content with id 'block-sitefarm-one-content'")
            return []

        links = content_tag.find_all("a")
        for link in links:
            href = str(link.get("href")) if isinstance(link, Tag) else None
            title = link.get_text().strip() if link.get_text() else ""
            if not href or not title:
                continue
            if href.endswith(".pdf"):
                logger.info(f"Found PDF link: {href}")
                policy_link_info_list.append(DocumentDetails(title, href))
        return policy_link_info_list

    async def __aiter__(self) -> AsyncIterator[DocumentDetails]:
        """
        Asynchronously iterate over the APM policies.
        Uses the get_browser_page context manager to handle browser lifecycle.
        """
        async with get_browser_page(user_agent) as page:
            policy_links: List[DocumentDetails] = await self.get_apm_links(page, self.apm_url)
            for policy in policy_links:
                yield policy


if __name__ == "__main__":
    source = Source(
        name="UCDAPM",
        url="https://academicaffairs.ucdavis.edu/apm/apm-toc",
        last_updated=None,
        type="UCDAPM")

    async def main():
        async for doc in UcdApmStream(source):
            print(doc)
            print(doc.metadata)
            continue

    asyncio.run(main())
