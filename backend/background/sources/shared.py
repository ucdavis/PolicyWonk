from contextlib import asynccontextmanager
import os
from typing import AsyncGenerator, Optional
import requests
import time
import uuid

from playwright.async_api import async_playwright, Page
import tiktoken

from background.logger import setup_logger

logger = setup_logger()

# safe user agent
user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def request_with_retry(url, retries=5, backoff_factor=1, **kwargs):
    if 'headers' not in kwargs:
        kwargs['headers'] = {'User-Agent': user_agent}
    else:
        if 'User-Agent' not in kwargs['headers']:
            kwargs['headers']['User-Agent'] = user_agent

    """
    Sends a GET request to the specified URL with retry mechanism.

    Args:
        url (str): The URL to send the request to.
        retries (int, optional): The number of retries to attempt. Defaults to 5.
        backoff_factor (int, optional): The backoff factor for exponential backoff. Defaults to 1.
        **kwargs: Additional keyword arguments to pass to the requests.get() function.

    Returns:
        requests.Response or None: The response object if the request is successful, None otherwise.

    >>> response = request_with_retry("https://example.com")
    >>> response.status_code == 200
    True
    """
    for attempt in range(retries):
        try:
            response = requests.get(url, **kwargs)
            if response.status_code == 200:
                return response
            else:
                logger.warning(
                    f"Request to {url} returned status code {response.status_code} on attempt {attempt + 1}"
                )
        except requests.exceptions.RequestException as e:
            logger.warning(
                f"Request to {url} failed on attempt {attempt + 1} with exception: {e}"
            )

        # If we are here, that means the request failed. We wait before
        # retrying.
        wait_time = backoff_factor * (2**attempt)
        logger.info(f"Retrying request to {url} in {wait_time} seconds...")
        time.sleep(wait_time)

    # If we exit the loop without returning, it means we've exhausted all
    # attempts
    logger.error(f"Failed to fetch {url} after {retries} attempts")
    return None


def download_document(url: str, dir: str) -> tuple[Optional[str], Optional[str]]:
    """ Download the document and return a path to the downloaded file and the content type """
    headers = {"User-Agent": user_agent}
    response = request_with_retry(
        url, headers=headers, allow_redirects=True, timeout=60
    )

    if not response:
        logger.error(f"Failed to download {url}")
        return None, None

    response.raise_for_status()

    content_type = response.headers.get("Content-Type")

    unique_filename = f"{uuid.uuid4()}"
    file_path = os.path.join(dir, unique_filename)

    with open(file_path, "wb") as file:
        file.write(response.content)

    return file_path, content_type


def num_tokens(content: str, encoding_name: str) -> int:
    """
    Returns the total number of tokens in the input string.

    Args:
        content (str): The text to be tokenized.
        encoding_name (str): The name of the encoding to use for tokenization.

    Returns:
        int: The number of tokens in the input string.

    Example:
        >>> num_tokens("Hello, world!", "cl100k_base")
        4
    """
    encoding = tiktoken.get_encoding(encoding_name)
    return len(encoding.encode(content))


@asynccontextmanager
async def get_browser_page(user_agent: str) -> AsyncGenerator[Page, None]:
    """
    Async context manager that launches Playwright, creates a browser context with the specified user agent,
    opens a new page, and ensures that the browser is closed after use.
    """
    async with async_playwright() as playwright:
        # set arg (headless=False) for local debugging (opens a visible browser window)
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=user_agent)
        page: Page = await context.new_page()
        try:
            yield page
        finally:
            await browser.close()
