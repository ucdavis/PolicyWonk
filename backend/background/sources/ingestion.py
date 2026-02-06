import asyncio
import os
import threading
from functools import partial
from typing import Any, Literal, cast
import importlib.util

from docling.document_converter import DocumentConverter

from background.logger import setup_logger

logger = setup_logger()


_DEFAULT_DOCLING_CONVERTER: DocumentConverter | None = None
_OcrBackend = Literal["onnxruntime", "openvino", "paddle", "torch"]
_PDF_OCR_DOCLING_CONVERTERS: dict[_OcrBackend, DocumentConverter] = {}
_DOCLING_INIT_LOCK = threading.Lock()
_DOCLING_CONVERT_LOCK = threading.Lock()


def _get_int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _get_str_env(name: str, default: str) -> str:
    raw = os.getenv(name)
    return default if raw is None or raw == "" else raw


def _is_probably_pdf(path: str) -> bool:
    if path.lower().endswith(".pdf"):
        return True
    try:
        with open(path, "rb") as f:
            return f.read(5) == b"%PDF-"
    except OSError:
        return False


def _get_default_docling_converter() -> DocumentConverter:
    global _DEFAULT_DOCLING_CONVERTER
    if _DEFAULT_DOCLING_CONVERTER is not None:
        return _DEFAULT_DOCLING_CONVERTER

    with _DOCLING_INIT_LOCK:
        if _DEFAULT_DOCLING_CONVERTER is None:
            _DEFAULT_DOCLING_CONVERTER = DocumentConverter()
        return _DEFAULT_DOCLING_CONVERTER


def _get_pdf_ocr_docling_converter(ocr_backend: _OcrBackend) -> DocumentConverter:
    """
    Create or reuse a PDF-only DocumentConverter configured for OCR-heavy PDFs.
    """
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import RapidOcrOptions, ThreadedPdfPipelineOptions
    from docling.document_converter import PdfFormatOption

    with _DOCLING_INIT_LOCK:
        existing = _PDF_OCR_DOCLING_CONVERTERS.get(ocr_backend)
        if existing is not None:
            return existing

        pipeline_options = ThreadedPdfPipelineOptions(
            do_ocr=True,
            do_table_structure=True,
            ocr_options=RapidOcrOptions(
                backend=ocr_backend,
                force_full_page_ocr=True,
            ),
            # Backpressure / memory caps
            queue_max_size=10,
            ocr_batch_size=1,
            layout_batch_size=1,
            table_batch_size=1,
            batch_polling_interval_seconds=0.5,
            # Do not retain page/picture/table images
            generate_page_images=False,
            generate_picture_images=False,
            generate_table_images=False,
        )

        converter = DocumentConverter(
            allowed_formats=[InputFormat.PDF],
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
            },
        )
        _PDF_OCR_DOCLING_CONVERTERS[ocr_backend] = converter
        return converter


def _detect_pdf_text_layer_stats(document_path: str) -> tuple[int, float]:
    """
    Returns (page_count, avg_text_chars_over_sample).
    """
    import fitz  # PyMuPDF

    sample_pages = max(1, _get_int_env("INGEST_PDF_SAMPLE_PAGES", 3))

    with fitz.open(document_path) as doc:
        page_count = int(doc.page_count)
        if page_count <= 0:
            return 0, 0.0

        sampled = min(sample_pages, page_count)
        text_chars = 0
        for i in range(sampled):
            try:
                page = doc.load_page(i)
                text_chars += len((page.get_text("text") or "").strip())
            except Exception:
                # treat failures as "no text" for the sample page
                continue

        avg = text_chars / max(1, sampled)
        return page_count, float(avg)


def _pdf_to_markdown_pymupdf4llm(document_path: str, page_count: int) -> str:
    import fitz  # PyMuPDF
    import pymupdf4llm

    with fitz.open(document_path) as doc:
        result = pymupdf4llm.to_markdown(
            doc,
            show_progress=False,
            page_chunks=True,
            force_text=True,
        )

    if isinstance(result, str):
        return result

    parts: list[str] = []
    for idx, item in enumerate(result):
        page_no = idx + 1
        page_text = ""
        if isinstance(item, dict):
            page_text = str(item.get("text") or "")
            meta = item.get("metadata")
            if isinstance(meta, dict):
                page_no = int(meta.get("page", page_no))

        parts.append(f"\n\n---\n\n<!-- page: {page_no} -->\n\n{page_text}")

    # Ensure we at least include a trailing newline.
    return "".join(parts).strip() + "\n"


def _pdf_to_markdown_docling_ocr(document_path: str, page_count: int) -> str:
    max_pages = _get_int_env("INGEST_PDF_MAX_PAGES", 500)
    if page_count > max_pages:
        raise RuntimeError(
            f"PDF has {page_count} pages which exceeds INGEST_PDF_MAX_PAGES={max_pages}"
        )

    chunk_threshold = _get_int_env("INGEST_PDF_CHUNK_THRESHOLD", 25)
    chunk_pages = max(1, _get_int_env("INGEST_PDF_CHUNK_PAGES", 10))

    requested_backend = _get_str_env("INGEST_PDF_OCR_BACKEND", "torch").lower()
    if requested_backend not in ("torch", "onnxruntime"):
        logger.warning(
            "Unsupported INGEST_PDF_OCR_BACKEND=%r; falling back to 'torch'.",
            requested_backend,
        )
        requested_backend = "torch"

    ocr_backend: _OcrBackend = cast(_OcrBackend, "torch")
    if requested_backend == "onnxruntime":
        if importlib.util.find_spec("onnxruntime") is None:
            logger.warning(
                "INGEST_PDF_OCR_BACKEND=onnxruntime requested, but onnxruntime is not installed. "
                "Falling back to RapidOCR torch backend."
            )
            ocr_backend = cast(_OcrBackend, "torch")
        else:
            ocr_backend = cast(_OcrBackend, "onnxruntime")
    else:
        ocr_backend = cast(_OcrBackend, "torch")

    converter = _get_pdf_ocr_docling_converter(ocr_backend=ocr_backend)

    def _convert_range(start: int, end: int) -> str:
        with _DOCLING_CONVERT_LOCK:
            res = converter.convert(document_path, page_range=(start, end))
        return res.document.export_to_markdown()

    if page_count > chunk_threshold:
        logger.info(
            "PDF OCR via Docling (backend=%s) with chunking: %s pages, chunk=%s pages",
            ocr_backend,
            page_count,
            chunk_pages,
        )
        parts: list[str] = []
        for start in range(1, page_count + 1, chunk_pages):
            end = min(page_count, start + chunk_pages - 1)
            chunk_md = _convert_range(start, end).strip()
            parts.append(
                f"\n\n---\n\n<!-- docling pages: {start}-{end} -->\n\n{chunk_md}")
        return "".join(parts).strip() + "\n"

    # Small PDFs: single pass.
    logger.info(
        "PDF OCR via Docling (backend=%s) single-pass: %s pages",
        ocr_backend,
        page_count,
    )
    return _convert_range(1, max(1, page_count)).strip() + "\n"


def ingest_path_to_markdown_sync(document_path: str) -> str:
    """
    Convert a document to markdown synchronously.

    Args:
        document_path (str): Path to the document.

    Returns:
        str: Markdown representation of the document.
    """
    if _is_probably_pdf(document_path):
        text_threshold = _get_int_env("INGEST_PDF_TEXT_CHARS_THRESHOLD", 200)

        try:
            page_count, avg_text_chars = _detect_pdf_text_layer_stats(
                document_path)
        except Exception:
            # If preflight fails, fall back to Docling default conversion.
            logger.exception(
                "PDF preflight failed for %s; falling back to Docling default conversion.",
                document_path,
            )
            with _DOCLING_CONVERT_LOCK:
                result = _get_default_docling_converter().convert(document_path)
            return result.document.export_to_markdown()

        if page_count <= 0:
            return ""

        if avg_text_chars >= text_threshold:
            logger.info(
                "PDF detected as text-based (%s pages, avg_text_chars=%.1f >= %s). Using pymupdf4llm.",
                page_count,
                avg_text_chars,
                text_threshold,
            )
            return _pdf_to_markdown_pymupdf4llm(document_path, page_count)
        else:
            logger.info(
                "PDF detected as scanned/low-text (%s pages, avg_text_chars=%.1f < %s). Using Docling OCR.",
                page_count,
                avg_text_chars,
                text_threshold,
            )
            return _pdf_to_markdown_docling_ocr(document_path, page_count)

    with _DOCLING_CONVERT_LOCK:
        result = _get_default_docling_converter().convert(document_path)
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
