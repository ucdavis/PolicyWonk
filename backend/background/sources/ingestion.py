import asyncio
from functools import partial

from docling.document_converter import DocumentConverter


def ingest_path_to_markdown_sync(document_path: str) -> str:
    """
    Convert a document to markdown synchronously.

    Args:
        document_path (str): Path to the document.

    Returns:
        str: Markdown representation of the document.
    """
    converter = DocumentConverter()
    result = converter.convert(document_path)

    return result.document.export_to_markdown()


async def ingest_path_to_markdown(document_path: str) -> str:
    """
    Convert a document to markdown asynchronously by offloading the conversion
    to a thread pool.

    Args:
        document_path (str): Path to the document.

    Returns:
        str: Markdown representation of the document.
    """
    loop = asyncio.get_running_loop()
    # Offload synchronous doc conversion to a thread pool
    return await loop.run_in_executor(None, partial(ingest_path_to_markdown_sync, document_path))
