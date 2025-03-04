from datetime import datetime
from urllib.parse import urljoin
import aiohttp
import asyncio
from typing import AsyncIterator

from background.logger import setup_logger
from background.sources.shared import DocumentStream
from db.models import Source
from models.document_details import DocumentDetails

logger = setup_logger()


class UcopDocumentStream(DocumentStream):
    def __init__(self, source: Source):
        super().__init__(source)
        self.base_url = source.url
        self.api_key = source.config.get("api_key")
        self.page_size = 50
        self.max_retries = 3

    async def __aiter__(self) -> AsyncIterator[DocumentDetails]:
        # TODO: Implement the logic to stream documents from the UCOP API

        raise NotImplementedError


if __name__ == "__main__":
    source = Source(
        name="PolicyWonk",
        url="https://policywonk.ucdavis.edu/api/",
        last_updated=None,
        type="DOCAPI")

    source.config = {
        "api_key": "my-api-key"
    }

    async def main():
        async for doc in UcopDocumentStream(source):
            print(doc)

    asyncio.run(main())
