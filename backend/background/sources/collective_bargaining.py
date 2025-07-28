import asyncio
import re
from dotenv import load_dotenv
from typing import List, AsyncIterator
from playwright.async_api import Page
from background.sources.shared import user_agent, get_browser_page

from background.logger import setup_logger
from db.models import Source
from models.document_details import DocumentDetails
from background.sources.document_stream import DocumentStream

load_dotenv()  # Loads environment variables from .env
logger = setup_logger()

BARGAINING_UNITS_URL = (
    "https://ucnet.universityofcalifornia.edu/resources/employment-"
    "policies-contracts/bargaining-units/"
)


class UcnetCollectiveBargainingStream(DocumentStream):
    def __init__(self, source: Source) -> None:
        super().__init__(source)
        self.max_retries: int = 3

    async def extract_pdf_links(self, page: Page) -> List[str]:
        """Return a list of PDF URLs from the current page."""
        pdf_links: List[str] = []
        try:
            # Wait briefly for the PDF list to load
            await page.wait_for_selector('a[href$=".pdf"]', timeout=5000)
        except Exception:
            # No PDF links on the page
            return pdf_links

        # Query all anchors with .pdf in href
        anchors = await page.query_selector_all('a[href$=".pdf"]')
        seen = set()
        for a in anchors:
            href = await a.get_attribute("href")
            if not href:
                continue
            # Normalize relative URLs to absolute
            if href.startswith("/"):
                href = f"https://ucnet.universityofcalifornia.edu{href}"
            # Filter duplicates
            if href not in seen:
                seen.add(href)
                pdf_links.append(href)
        return pdf_links

    async def get_systemwide_units(self, page: Page) -> List[DocumentDetails]:
        """Extract systemwide bargaining unit contracts."""
        policy_details_list: List[DocumentDetails] = []

        # Navigate to the landing page
        await page.goto(BARGAINING_UNITS_URL)
        await page.wait_for_load_state("networkidle")

        logger.info(f"Navigated to {BARGAINING_UNITS_URL}")

        # The systemwide units are in accordion sections under the "Systemwide bargaining units by union" heading
        accordion_sections = await page.query_selector_all(".wp-block-ns-accordion__item")
        logger.info(f"Found {len(accordion_sections)} accordion sections")

        for i, accordion in enumerate(accordion_sections):
            button = await accordion.query_selector(".wp-block-ns-accordion__item-toggle")
            if not button:
                continue

            union_name = (await button.inner_text()).strip()
            logger.info(f"Processing accordion {i}: {union_name}")

            # Determine if this is a systemwide union or a local campus
            # Campus names typically contain "UC" followed by campus name
            # not the best method but works for current structure
            is_campus = any(campus_indicator in union_name for campus_indicator in [
                "UC Berkeley", "UC Davis", "UC Irvine", "UC Los Angeles", "UCLA",
                "UC Merced", "UC Riverside", "UC San Diego", "UC Santa Barbara",
                "UC Santa Cruz", "UC San Francisco", "Lawrence Berkeley"
            ])

            if is_campus:
                # This is a local campus accordion, skip it in systemwide processing
                logger.info(
                    f"Skipping campus accordion in systemwide: {union_name}")
                continue

            # Click to expand the accordion if it's not already expanded
            try:
                await button.click()
                await page.wait_for_timeout(500)  # Wait for expansion
            except:
                pass

            # Look for links in this accordion section
            links = await accordion.query_selector_all("a")
            logger.info(f"Found {len(links)} links in {union_name}")

            for link in links:
                link_text = (await link.inner_text()).strip()
                href = await link.get_attribute("href")

                if not href or not link_text:
                    continue

                logger.info(f"Processing systemwide link: {link_text}")

                # Parse the link text to extract code and name (format: "CODE — Name")
                match = re.match(r"^(\w+)\s+—\s+(.*)", link_text)
                if not match:
                    logger.warning(
                        f"Link text doesn't match expected format: {link_text}")
                    continue

                code, name = match.groups()
                logger.info(f"Found systemwide unit: {code} - {name}")

                # The href should be the contract page URL
                contract_url = href
                if not contract_url.startswith("http"):
                    contract_url = f"https://ucnet.universityofcalifornia.edu{contract_url}"

                # Open the contract page in a new tab
                contract_page = await page.context.new_page()
                try:
                    await contract_page.goto(contract_url, timeout=30000)
                    await contract_page.wait_for_load_state("networkidle")
                    pdf_links = await self.extract_pdf_links(contract_page)

                    logger.info(f"Found {len(pdf_links)} PDFs for {code}")

                    # Create DocumentDetails for each PDF
                    for pdf_url in pdf_links:
                        title = pdf_url.split("/")[-1].replace(".pdf", "")
                        logger.info(
                            f"Creating DocumentDetails for: {title} from {pdf_url}")
                        policy_detail = DocumentDetails(
                            title=title,
                            url=pdf_url,
                            metadata={
                                "keywords": [code, name, "ucop"],
                                "subject_areas": ["Collective Bargaining", code],
                                "responsible_office": "ucop"
                            }
                        )
                        policy_details_list.append(policy_detail)
                except Exception as e:
                    logger.error(
                        f"Error processing systemwide unit {code}: {e}")
                finally:
                    await contract_page.close()

        logger.info(
            f"Total systemwide policy details: {len(policy_details_list)}")
        return policy_details_list

    async def get_local_units(self, page: Page) -> List[DocumentDetails]:
        """Extract local bargaining unit contracts."""
        policy_details_list: List[DocumentDetails] = []

        # Extract local units - they are in the accordion sections that represent campuses
        accordion_sections = await page.query_selector_all(".wp-block-ns-accordion__item")
        logger.info(
            f"Processing {len(accordion_sections)} accordion sections for local units")

        for i, accordion in enumerate(accordion_sections):
            button = await accordion.query_selector(".wp-block-ns-accordion__item-toggle")
            if not button:
                continue

            union_name = (await button.inner_text()).strip()
            logger.info(
                f"Checking accordion {i} for local units: {union_name}")

            # Determine if this is a local campus accordion
            # Campus names typically contain "UC" followed by campus name
            campus_indicators = [
                "UC Berkeley", "UC Davis", "UC Irvine", "UC Los Angeles", "UCLA",
                "UC Merced", "UC Riverside", "UC San Diego", "UC Santa Barbara",
                "UC Santa Cruz", "UC San Francisco", "Lawrence Berkeley"
            ]

            is_campus = any(
                campus_indicator in union_name for campus_indicator in campus_indicators)

            if not is_campus:
                # This is not a campus accordion, skip it in local processing
                continue

            campus_name = union_name
            logger.info(f"Processing local campus: {campus_name}")

            # Click to expand the accordion if it's not already expanded
            try:
                await button.click()
                await page.wait_for_timeout(500)  # Wait for expansion
            except:
                pass

            # Look for links in this accordion section
            links = await accordion.query_selector_all("a")
            logger.info(f"Found {len(links)} links in {campus_name}")

            for link in links:
                link_text = (await link.inner_text()).strip()
                href = await link.get_attribute("href")

                if not href or not link_text:
                    continue

                logger.info(f"Processing local link: {link_text}")

                # Parse the link text to extract code and name (format: "CODE — Name")
                match = re.match(r"^(\w+)\s+—\s+(.*)", link_text)
                if not match:
                    logger.warning(
                        f"Link text doesn't match expected format: {link_text}")
                    continue

                code, name = match.groups()
                logger.info(
                    f"Found local unit: {code} - {name} at {campus_name}")

                # The href should be the contract page URL
                contract_url = href
                if not contract_url.startswith("http"):
                    contract_url = f"https://ucnet.universityofcalifornia.edu{contract_url}"

                # Open the contract page in a new tab
                contract_page = await page.context.new_page()
                try:
                    await contract_page.goto(contract_url, timeout=30000)
                    await contract_page.wait_for_load_state("networkidle")
                    pdf_links = await self.extract_pdf_links(contract_page)

                    logger.info(
                        f"Found {len(pdf_links)} PDFs for {code} at {campus_name}")

                    # Create DocumentDetails for each PDF
                    for pdf_url in pdf_links:
                        title = pdf_url.split("/")[-1].replace(".pdf", "")
                        policy_detail = DocumentDetails(
                            title=title,
                            url=pdf_url,
                            metadata={
                                "keywords": [code, name, campus_name],
                                "subject_areas": ["Collective Bargaining", code],
                                "responsible_office": campus_name
                            }
                        )
                        policy_details_list.append(policy_detail)
                except Exception as e:
                    logger.error(
                        f"Error processing local unit {code} at {campus_name}: {e}")
                finally:
                    await contract_page.close()

        logger.info(f"Total local policy details: {len(policy_details_list)}")
        return policy_details_list

    async def get_uc_collective_bargaining_links(self, page: Page) -> List[DocumentDetails]:
        """
        Combines systemwide and local union contracts into a single list of DocumentDetails.
        """
        policy_details: List[DocumentDetails] = []
        policy_details += await self.get_systemwide_units(page)
        policy_details += await self.get_local_units(page)
        return policy_details

    async def __aiter__(self) -> AsyncIterator[DocumentDetails]:
        """
        Asynchronously iterate over the collective bargaining contracts.
        Launches the browser, navigates to the UCOP Collective Bargaining page,
        retrieves union details and contracts, and yields each contract as a DocumentDetails object.
        """
        async with get_browser_page(user_agent) as page:
            policy_links: List[DocumentDetails] = await self.get_uc_collective_bargaining_links(page)
            for policy in policy_links:
                yield policy


if __name__ == "__main__":
    print("Starting cb.py script...")
    source = Source(
        name="UCCONTRACTS",
        url="https://ucnet.universityofcalifornia.edu/resources/employment-policies-contracts/bargaining-units/",
        last_updated=None,
        type="UCCONTRACTS"
    )

    async def main():
        print("Starting async main...")
        count = 0
        async for doc in UcnetCollectiveBargainingStream(source):
            count += 1
            print(f"Document {count}: {doc.title}")
            print(f"URL: {doc.url}")
            print(f"Metadata: {doc.metadata}")
            print("---")
        print(f"Total documents found: {count}")

    asyncio.run(main())
