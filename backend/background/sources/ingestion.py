import asyncio
from functools import partial

from docling.document_converter import DocumentConverter


def ingest_url_sync(document_path: str) -> str:
    """URL content -> Markdown"""
    converter = DocumentConverter()
    result = converter.convert(document_path)

    return result.document.export_to_markdown()


async def ingest_url(document_path: str) -> str:
    loop = asyncio.get_running_loop()
    # Offload synchronous doc conversion to a thread pool
    return await loop.run_in_executor(None, partial(ingest_url_sync, document_path))
