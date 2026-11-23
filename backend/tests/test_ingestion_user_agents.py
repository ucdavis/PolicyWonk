import asyncio
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, Mock

from background.sources import apm, shared, ucd
from db.models import Source


def test_apm_uses_crawler_identity_and_resolves_relative_pdfs(monkeypatch):
    page = Mock()
    page.goto = AsyncMock(return_value=Mock(ok=True))
    page.wait_for_selector = AsyncMock()
    page.content = AsyncMock(return_value="""
        <main id="block-sitefarm-one-content">
            <a href="/files/UCD-220I.pdf">UCD-220I</a>
            <a href="https://aadocs.ucdavis.edu/policies/apm/apm-560.pdf">APM 560</a>
        </main>
    """)

    @asynccontextmanager
    async def browser(user_agent):
        assert user_agent == (
            "UCDavis-PolicyWonk-Crawler/1.0 (+https://policywonk.ucdavis.edu/)"
        )
        yield page

    monkeypatch.setattr(apm, "get_browser_page", browser)
    stream = apm.UcdApmStream(Source(name="APM"))

    async def collect():
        return [document.url async for document in stream]

    assert asyncio.run(collect()) == [
        "https://academicaffairs.ucdavis.edu/files/UCD-220I.pdf",
        "https://aadocs.ucdavis.edu/policies/apm/apm-560.pdf",
    ]
    page.goto.assert_awaited_once_with(
        stream.apm_url, wait_until="domcontentloaded")


def test_ellucid_opens_its_browser_with_the_chrome_identity(monkeypatch):
    page = Mock(goto=AsyncMock(), wait_for_selector=AsyncMock())

    @asynccontextmanager
    async def browser(user_agent):
        assert user_agent == shared.CHROME_USER_AGENT
        assert "Chrome/158.0.0.0" in user_agent
        yield page

    monkeypatch.setattr(ucd, "get_browser_page", browser)
    stream = ucd.UcdPolicyManualDocumentStream(Source(name="UC Davis policies"))
    monkeypatch.setattr(stream, "get_ucd_policy_links", AsyncMock(return_value=[]))

    async def collect():
        return [document async for document in stream]

    assert asyncio.run(collect()) == []
    page.goto.assert_awaited_once_with(ucd.base_url)
    assert stream.get_ucd_policy_links.await_count == 4


def test_download_defaults_to_the_crawler_identity(monkeypatch, tmp_path):
    response = Mock(status_code=200, headers={"Content-Type": "application/pdf"})
    response.iter_content.return_value = [b"%PDF-"]
    get = Mock(return_value=response)
    monkeypatch.setattr(shared.requests, "get", get)
    url = "https://ucdavispolicy.ellucid.com/pman/download/revision/3363"

    _, content_type = shared.download_document(url, str(tmp_path))

    assert content_type == "application/pdf"
    assert get.call_args.kwargs["headers"]["User-Agent"] == shared.CRAWLER_USER_AGENT
