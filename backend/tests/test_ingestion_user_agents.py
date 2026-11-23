import asyncio
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, Mock, call

import pytest
from playwright.async_api import TimeoutError as PlaywrightTimeoutError

from background.sources import apm, shared, ucd
from db.models import Source

EXPECTED_CRAWLER_USER_AGENT = (
    "UCDavis-PolicyWonk-Crawler/1.0 (+https://policywonk.ucdavis.edu/)"
)


@pytest.fixture
def browser(monkeypatch):
    page = Mock(goto=AsyncMock(), wait_for_selector=AsyncMock())
    context = Mock(new_page=AsyncMock(return_value=page), close=AsyncMock())
    new_context = AsyncMock(return_value=context)
    chromium = Mock(launch=AsyncMock(return_value=Mock(
        new_context=new_context, close=AsyncMock()
    )))

    @asynccontextmanager
    async def playwright():
        yield Mock(chromium=chromium)

    monkeypatch.setattr(shared, "async_playwright", playwright)
    return page, new_context


def test_apm_uses_crawler_identity_and_resolves_relative_pdfs(browser):
    page, new_context = browser
    page.content = AsyncMock(return_value="""
        <main id="block-sitefarm-one-content">
            <a href="/files/UCD-220I.pdf">UCD-220I</a>
            <a href="https://aadocs.ucdavis.edu/policies/apm/apm-560.pdf">APM 560</a>
        </main>
    """)

    stream = apm.UcdApmStream(Source(name="APM"))

    async def collect():
        return [document.url async for document in stream]

    assert asyncio.run(collect()) == [
        "https://academicaffairs.ucdavis.edu/files/UCD-220I.pdf",
        "https://aadocs.ucdavis.edu/policies/apm/apm-560.pdf",
    ]
    new_context.assert_awaited_once_with(user_agent=EXPECTED_CRAWLER_USER_AGENT)
    page.goto.assert_awaited_once_with(
        stream.apm_url, wait_until="domcontentloaded")


def test_apm_reports_missing_catalog_through_the_selector_wait(browser):
    page, _ = browser
    page.goto.return_value = Mock(ok=False, status=403)
    page.wait_for_selector.side_effect = PlaywrightTimeoutError("Catalog missing")
    stream = apm.UcdApmStream(Source(name="APM"))

    async def collect():
        return [document async for document in stream]

    with pytest.raises(PlaywrightTimeoutError, match="Catalog missing"):
        asyncio.run(collect())
    page.wait_for_selector.assert_awaited_once_with(
        "#block-sitefarm-one-content", timeout=10000)


def test_ellucid_uses_chrome_and_yields_policy_with_download_url(browser):
    page, new_context = browser
    page.locator.return_value = Mock(
        select_option=AsyncMock(), click=AsyncMock(), all=AsyncMock(return_value=[])
    )
    page.wait_for_timeout = AsyncMock()
    homepage = "https://ucdavispolicy.ellucid.com"
    binder = "https://ucdavispolicy.ellucid.com/pman/manuals/binder"
    policy_url = "https://ucdavispolicy.ellucid.com/pman/documents/42"
    pages = {
        f"{binder}/11": """
            <div class="ag-center-cols-container">
                <div role="row">
                    <div role="gridcell" col-id="element">
                        <div class="browse-link">
                            <a href="/pman/documents/42">Travel policy</a>
                        </div>
                    </div>
                </div>
            </div>
        """,
        policy_url: """
            <h1 class="doc_title">Travel policy</h1>
            <iframe id="document-viewer" src="/pman/view/revision/3363"></iframe>
        """,
        f"{binder}/13": '<div class="ag-center-cols-container"></div>',
        f"{binder}/243": '<div class="ag-center-cols-container"></div>',
        f"{binder}/15": '<div class="ag-center-cols-container"></div>',
    }
    page.goto.side_effect = lambda url: setattr(page, "url", url)
    page.content = AsyncMock(side_effect=lambda: pages[page.url])

    stream = ucd.UcdPolicyManualDocumentStream(Source(name="UC Davis policies"))

    async def collect():
        return [(document.url, document.direct_download_url) async for document in stream]

    assert asyncio.run(collect()) == [
        (policy_url, "https://ucdavispolicy.ellucid.com/pman/download/revision/3363"),
    ]
    new_context.assert_awaited_once_with(user_agent=(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36"
    ))
    assert page.goto.await_args_list == [
        call(homepage), call(f"{binder}/11"), call(policy_url),
        call(f"{binder}/13"), call(f"{binder}/243"), call(f"{binder}/15"),
    ]


def test_download_defaults_to_the_crawler_identity(monkeypatch, tmp_path):
    response = Mock(status_code=200, headers={"Content-Type": "application/pdf"})
    response.iter_content.return_value = [b"%PDF-"]
    get = Mock(return_value=response)
    monkeypatch.setattr(shared.requests, "get", get)
    url = "https://ucdavispolicy.ellucid.com/pman/download/revision/3363"

    _, content_type = shared.download_document(url, str(tmp_path))

    assert content_type == "application/pdf"
    assert get.call_args.kwargs["headers"]["User-Agent"] == EXPECTED_CRAWLER_USER_AGENT


def test_shared_request_preserves_explicit_user_agent(monkeypatch):
    response = Mock(status_code=200)
    get = Mock(return_value=response)
    monkeypatch.setattr(shared.requests, "get", get)
    url = "https://example.com/catalog"

    assert shared.request_with_retry(url, headers={"User-Agent": "Custom/1.0"}) is response
    get.assert_called_once_with(url, headers={"User-Agent": "Custom/1.0"})
