from datetime import datetime
from urllib.parse import urljoin
import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup, Tag

from typing import AsyncIterator

from background.logger import setup_logger
from background.sources.ingestion import ingest_url
from background.sources.shared import DocumentStream
from db.models import Source
from models.document_details import DocumentDetails

logger = setup_logger()

# TODO: move to shared
user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# UCOP Policies are on `https://policy.ucop.edu`
base_url = "https://policy.ucop.edu"


class UcopDocumentStream(DocumentStream):
    def __init__(self, source: Source):
        super().__init__(source)
        self.policy_url = source.url
        self.max_retries = 3

    async def __aiter__(self) -> AsyncIterator[DocumentDetails]:
        # We'll use playwright to read the provided policies page and get back the list of policies
        # then we'll loop through each and grab the policy PDF, parse it and return the DocumentDetails

        async with async_playwright() as playwright:
            # Launch browser with custom user agent
            browser = await playwright.chromium.launch()
            context = await browser.new_context(user_agent=user_agent)

            # Create new page and navigate to UCOP policies
            page = await context.new_page()

            try:
                # Navigate and wait for content to load
                await page.goto(self.policy_url)
                await page.wait_for_selector("#accordion", state="visible")

                # Get page content after JavaScript execution
                content = await page.content()

                # Parse with BeautifulSoup
                soup = BeautifulSoup(content, "html.parser")
            except Exception as e:
                print(f"Couldn't fetch policy info: {str(e)}")
            finally:
                await context.close()
                await browser.close()

            # we now have the page content, let's get all policies
            # Find the element with the id 'accordion'
            accordion = soup.find(id="accordion")

            if not isinstance(accordion, Tag):
                logger.error("Couldn't find the accordion element")
                return

            # Find all 'a' tags within the accordion with class="blue"
            links = accordion.find_all("a", class_="blue")

            for link in links:
                # Get href directly from the link tag but convert to absolute url
                href = urljoin(base_url, link["href"])

                logger.info(f"Processing policy at {href}")

                # For the title, find the first (or only) 'span' with class 'icon pdf' within the link
                span = link.find("span", class_="icon pdf")
                if span:  # Check if the span exists
                    title = span.text.strip()
                else:
                    title = "Title not found"

                # get the parent of the link and find the next 4 sibling divs - subject areas, effective date, issuance date, responsible office
                parent = link.parent

                # Get the next 4 sibling divs
                siblings = parent.find_next_siblings("div")

                # Get the text from each sibling but ignore the <cite> tag
                subject_areas_text = (
                    siblings[0].text.replace(
                        siblings[0].find("cite").text, "").strip()
                )
                effective_date = (
                    siblings[1].text.replace(
                        siblings[1].find("cite").text, "").strip()
                )
                issuance_date = (
                    siblings[2].text.replace(
                        siblings[2].find("cite").text, "").strip()
                )
                responsible_office = (
                    siblings[3].text.replace(
                        siblings[3].find("cite").text, "").strip()
                )
                classifications = ["Policy"]

                # subject areas is a comma separated list, so split it into a list
                subject_areas = [area.strip()
                                 for area in subject_areas_text.split(",")]

                # extract the content of the policy PDF
                markdown_content = ingest_url(href)

                # Create a DocumentDetails object with the extracted information
                doc = DocumentDetails(
                    title=title,
                    url=href,
                    description="",
                    content=markdown_content,
                    last_modified=datetime.now().isoformat(),
                    metadata={
                        "subject_areas": subject_areas,
                        "effective_date": effective_date,
                        "issuance_date": issuance_date,
                        "responsible_office": responsible_office,
                        "classifications": classifications
                    }
                )

                logger.info(f"Processed policy: {doc.title} at {doc.url}")

                yield doc


if __name__ == "__main__":
    source = Source(
        name="UCOP",
        url="https://policy.ucop.edu/advanced-search.php?action=welcome&op=browse",
        last_updated=None,
        type="UCOP")

    async def main():
        async for doc in UcopDocumentStream(source):
            print(doc)

    asyncio.run(main())
