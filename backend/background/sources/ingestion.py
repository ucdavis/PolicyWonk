from docling.document_converter import DocumentConverter


def ingest_url(pdf_path: str) -> str:
    """URL content -> Markdown"""
    converter = DocumentConverter()
    result = converter.convert(pdf_path)

    return result.document.export_to_markdown()
