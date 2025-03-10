#!/usr/bin/env python

import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from background.sources.shared import user_agent

# UCOP Policies are on `https://policy.ucop.edu`
base_url = "https://policy.ucop.edu"


def get_ucop_policies_url():
    return f"{base_url}/advanced-search.php?action=welcome&op=browse&all=1"


async def scrape_policies():
    async with async_playwright() as p:
        # Launch browser with custom user agent
        browser = await p.chromium.launch()
        context = await browser.new_context(user_agent=user_agent)

        # Create new page and navigate to UCOP policies
        page = await context.new_page()
        url = get_ucop_policies_url()

        try:
            # Navigate and wait for content to load
            await page.goto(url)
            await page.wait_for_selector("#accordion", state="visible")

            # Get page content after JavaScript execution
            content = await page.content()

            # Parse with BeautifulSoup
            soup = BeautifulSoup(content, "html.parser")
            accordion = soup.find(id="accordion")

            if accordion:
                print("Successfully loaded policies page and found accordion content")
                # Add your parsing logic here
                print(
                    accordion.get_text()[:500] + "..."
                )  # Print first 500 chars as preview
            else:
                print("Error: Accordion element not found in parsed content")

        except Exception as e:
            print(f"Error during scraping: {str(e)}")
        finally:
            await context.close()
            await browser.close()


# Run the async function
if __name__ == "__main__":
    asyncio.run(scrape_policies())
