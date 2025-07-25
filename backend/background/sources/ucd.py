import re
from urllib.parse import urljoin
import asyncio
from playwright.async_api import TimeoutError as PlaywrightTimeoutError, Page
from bs4 import BeautifulSoup, Tag

from typing import AsyncIterator, List, Optional, Tuple

from background.logger import setup_logger
from background.sources.document_stream import DocumentStream
from background.sources.shared import user_agent, get_browser_page
from db.models import Source
from models.document_details import DocumentDetails

logger = setup_logger()

# UCD Policies are on `https://ucdavispolicy.ellucid.com`
# There are several different binders each with their own set of policies
base_url = "https://ucdavispolicy.ellucid.com"
home_url_minus_binder = f"{base_url}/pman/manuals/binder"

# make a dictionary of the different binders
binders = {
    "11": "ucdppm",
    "13": "ucdppsm",
    "243": "ucdinterim",
    "15": "ucddelegation",
}

# never navigate into these folders
ignore_folders = ["Parent Directory"]
# tag these folders as revision history
# revision_folders = ["PPM Revision History", "PPSM Revision History"]


class UcdPolicyManualDocumentStream(DocumentStream):
    def __init__(self, source: Source):
        super().__init__(source)
        self.policy_url = source.url
        self.max_retries = 3

    def get_policy_binders(self):
        """Get the list of policy binders from the UCD Ellucid site."""
        return [(binder, f"{home_url_minus_binder}/{binder}") for binder in binders]

    async def __aiter__(self) -> AsyncIterator[DocumentDetails]:
        """
        Get the list of UC Davis policies to index.

        - Must start from the homepage so the site can setup your session 
        - The policies are organized by binders.
        - Each policy page contains an iframe with the actual PDF source.
        """
        async with get_browser_page(user_agent) as page:
            # before anything else, we need to navigate to the homepage
            await page.goto(base_url)

            # wait until the page is loaded and we see "UC Davis Administrative Policy Manuals"
            try:
                await page.wait_for_selector(
                    "h1:has-text('UC Davis Administrative Policy Manuals')", timeout=10000)
            except PlaywrightTimeoutError as e:
                logger.error(f"Error waiting for homepage: {e}")
                return

            logger.info("PMAN Homepage loaded successfully")

            for binder in self.get_policy_binders():
                _, binder_url = binder
                policy_links = await self.get_ucd_policy_links(page, binder_url)
                for policy in policy_links:
                    yield policy

    async def get_ucd_policy_links(self, page: Page, url: str) -> List[DocumentDetails]:
        """
        Get policy links from the provided URL.
        For each policy page, navigate to it and extract the true PDF source
        from the iframe.
        """
        policy_links = await self.get_nested_links(page, url)
        for policy in policy_links:
            await self.populate_document_details(page, policy)
        return policy_links

    def sanitize_filename(self, filename: str) -> str:
        """Sanitize the filename by removing or replacing invalid characters."""
        return re.sub(r'[\\/*?:"<>|]', "", filename)

    async def populate_document_details(self, page: Page, policy: DocumentDetails):
        """
        We need to pull the real doc source out of the iframe src element
        Then we change that URL to a direct download link.
        """
        await page.goto(policy.url)
        try:
            await page.wait_for_selector("#document-viewer", timeout=10000)
        except PlaywrightTimeoutError as e:
            logger.error(f"Error waiting for iframe: {e}")
            return

        content = await page.content()
        soup = BeautifulSoup(content, "html.parser")
        title_element = soup.find(class_="doc_title")
        policy.title = title_element.get_text(
            strip=True) if title_element else "Untitled"

        iframe = soup.find(id="document-viewer")

        iframe_src = str(iframe.get("src")) if isinstance(
            iframe, Tag) else None

        if not iframe_src or "view/" not in iframe_src:
            logger.error(
                f"Invalid iframe source for policy: {policy.url} - {iframe_src}")
            return

        # Set the direct download URL by replacing "view/" with "download/"

        policy.direct_download_url = urljoin(
            base_url, iframe_src.replace("/view/", "/download/"))

    async def get_links(self, page: Page, url: str) -> List[DocumentDetails]:
        await page.goto(url)
        try:
            await page.wait_for_selector(".browse-link", timeout=10000)
        except PlaywrightTimeoutError as e:
            logger.error(f"Error waiting for content: {e}")
            return []
        content = await page.content()
        soup = BeautifulSoup(content, "html.parser")
        return self.get_policy_details_from_table(soup)

    def get_policy_details_from_table(self, soup: BeautifulSoup) -> List[DocumentDetails]:
        """
        Extract policy details from the table in the given BeautifulSoup object.
        Returns a list of DocumentDetails objects.
        """
        all_links: List[DocumentDetails] = []
        rows = soup.select("div.ag-center-cols-container div[role=row]")
        for row in rows:
            policyRow = DocumentDetails()
            columns = row.select("div[role=gridcell]")
            for column in columns:
                col_id = column.get("col-id")
                text = column.text.strip()
                if col_id == "approvedOn":
                    policyRow.metadata["effective_date"] = text
                    policyRow.metadata["issuance_date"] = text
                elif col_id == "keywords":
                    policyRow.metadata["keywords"] = [keyword.strip()
                                                      for keyword in text.split(",")]
                elif col_id == "standardReferences":
                    policyRow.metadata["subject_areas"] = [
                        area.strip() for area in text.split(";")]
                elif col_id == "documentClassifications":
                    policyRow.metadata["classifications"] = [
                        classification.strip() for classification in text.split(",")]
                elif col_id == "element":
                    a = column.select_one("div.browse-link a")
                    if a:
                        policyRow.title = a.text.strip()
                        policyRow.url = urljoin(base_url, str(a["href"]))
                        policyRow.filename = self.sanitize_filename(
                            policyRow.title)
            all_links.append(policyRow)
        return all_links

    async def get_nested_links(self, page: Page, url: str) -> List[DocumentDetails]:
        """
        Recursively retrieves file links by navigating through folders and documents.
        Adjusts the page size and shows all columns before extraction.
        """
        await page.goto(url)
        try:
            await page.wait_for_selector(".browse-link", timeout=10000)
        except PlaywrightTimeoutError as e:
            logger.error(f"Error waiting for content: {e}")
            return []

        # Change the page size to 100
        await page.locator(".page-size").select_option("100")

        # Click the column button and then all the checkboxes
        await page.locator(".ag-side-button").click()
        try:
            await page.wait_for_selector(".ag-column-tool-panel-column", timeout=3000)
        except PlaywrightTimeoutError:
            pass

        checkbox_spans = await page.locator(".ag-column-tool-panel-column").all()
        for cb in checkbox_spans:
            await cb.click()

        # Wait for the page to update
        await page.wait_for_timeout(3000)
        content = await page.content()

        soup = BeautifulSoup(content, "html.parser")
        file_links: List[DocumentDetails] = []
        all_links: List[DocumentDetails] = self.get_policy_details_from_table(
            soup)

        for link in all_links:
            if link.title in ignore_folders:
                continue
            if "/manuals/binder" in link.url:
                nested_links = await self.get_links(page, link.url)
                for nested_link in nested_links:
                    if nested_link.title in ignore_folders:
                        continue
                    if "/manuals/binder" in nested_link.url:
                        deep_nested_links = await self.get_links(page, nested_link.url)
                        for deep_nested_link in deep_nested_links:
                            if deep_nested_link.title in ignore_folders:
                                continue
                            if "/documents" in deep_nested_link.url:
                                file_links.append(deep_nested_link)
                    else:
                        file_links.append(nested_link)
            else:
                file_links.append(link)
        return file_links


if __name__ == "__main__":
    source = Source(
        name="UCDPOLICYMANUAL",
        url="https://ucdavispolicy.ellucid.com",
        last_updated=None,
        type="UCDPOLICYMANUAL")

    async def main():
        async for doc in UcdPolicyManualDocumentStream(source):
            print(doc)
            print(doc.metadata)

    asyncio.run(main())
