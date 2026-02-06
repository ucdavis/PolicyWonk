import argparse
import os
import sys
import tempfile
from pathlib import Path
from typing import Iterable

import fitz  # PyMuPDF

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from background.sources.ingestion import ingest_path_to_markdown_sync
from background.sources.shared import download_document


DEFAULT_URLS: list[str] = [
    # Large (90 pages) text-based PDF
    "https://ucnet.universityofcalifornia.edu/wp-content/uploads/2025/06/Final-Implementation-Package-EX-2025.pdf",
    # Another UCNet PDF (often large)
    "https://ucnet.universityofcalifornia.edu/labor/bargaining-units/ex/docs/ex_000_complete.pdf",
]


def _iter_chunks(text: str, limit: int) -> str:
    if limit <= 0:
        return ""
    return text[:limit]


def _make_text_pdf(path: str) -> None:
    doc = fitz.open()
    page = doc.new_page()
    # Make sure this crosses the default text-threshold (200 chars) easily.
    lines = [f"Line {i}: The quick brown fox jumps over the lazy dog." for i in range(1, 40)]
    page.insert_text((72, 72), "\n".join(lines))
    doc.save(path)
    doc.close()


def _make_scanned_pdf(path: str) -> None:
    """
    Create an image-only (no text layer) PDF without requiring PIL:
    1) Create a temporary text PDF
    2) Render its page to a pixmap
    3) Insert the pixmap as a full-page image into a new PDF
    """
    with tempfile.TemporaryDirectory() as td:
        src = os.path.join(td, "src.pdf")
        _make_text_pdf(src)

        src_doc = fitz.open(src)
        pix = src_doc.load_page(0).get_pixmap(dpi=150)
        rect = src_doc.load_page(0).rect
        src_doc.close()

        out_doc = fitz.open()
        out_page = out_doc.new_page(width=rect.width, height=rect.height)
        out_page.insert_image(rect, pixmap=pix)
        out_doc.save(path)
        out_doc.close()


def _download_to_temp(url: str) -> tuple[str | None, str | None]:
    with tempfile.TemporaryDirectory() as td:
        local_path, content_type = download_document(url, td)
        if not local_path:
            return None, None
        # Move to a stable, non-deleted temp file so caller can open it after the context.
        suffix = ".pdf" if (content_type or "").lower().startswith("application/pdf") else ""
        stable_fd, stable_path = tempfile.mkstemp(suffix=suffix)
        os.close(stable_fd)
        Path(local_path).replace(stable_path)
        return stable_path, content_type


def _print_result(label: str, markdown: str, max_chars: int) -> None:
    md_preview = _iter_chunks(markdown, max_chars).replace("\n", "\\n")
    print(f"\n=== {label} ===")
    print(f"markdown_len={len(markdown)} preview_len={min(len(markdown), max_chars)}")
    print(md_preview)


def run_local_sanity(max_chars: int, include_ocr: bool) -> None:
    with tempfile.TemporaryDirectory() as td:
        text_pdf = os.path.join(td, "text.pdf")
        _make_text_pdf(text_pdf)
        md = ingest_path_to_markdown_sync(text_pdf)
        _print_result("local-text-pdf", md, max_chars=max_chars)

        if include_ocr:
            scanned_pdf = os.path.join(td, "scanned.pdf")
            _make_scanned_pdf(scanned_pdf)
            try:
                md2 = ingest_path_to_markdown_sync(scanned_pdf)
                _print_result("local-scanned-pdf", md2, max_chars=max_chars)
            except Exception as e:
                print("\n=== local-scanned-pdf ===")
                print("FAILED (this will download OCR models on first run):", repr(e))


def run_remote_sanity(urls: Iterable[str], max_chars: int) -> None:
    for url in urls:
        print(f"\nDownloading: {url}")
        local_path, content_type = _download_to_temp(url)
        if not local_path:
            print("FAILED download")
            continue

        try:
            md = ingest_path_to_markdown_sync(local_path)
            _print_result(f"remote:{Path(url).name or url}", md, max_chars=max_chars)
        except Exception as e:
            print(f"\n=== remote:{Path(url).name or url} ===")
            print("FAILED:", repr(e))
        finally:
            try:
                os.remove(local_path)
            except OSError:
                pass


def main() -> None:
    parser = argparse.ArgumentParser(description="Sanity-check PDF ingestion to markdown.")
    parser.add_argument("--max-chars", type=int, default=800, help="Max markdown chars to preview.")
    parser.add_argument(
        "--urls",
        nargs="*",
        default=DEFAULT_URLS,
        help="Remote URLs to download and ingest.",
    )
    parser.add_argument(
        "--no-remote",
        action="store_true",
        help="Skip remote URL tests (useful if offline).",
    )
    parser.add_argument(
        "--include-ocr",
        action="store_true",
        help="Also run a local scanned-PDF OCR sanity test (may download OCR models).",
    )
    args = parser.parse_args()

    print("Env knobs (optional):")
    for k in (
        "INGEST_PDF_TEXT_CHARS_THRESHOLD",
        "INGEST_PDF_SAMPLE_PAGES",
        "INGEST_PDF_MAX_PAGES",
        "INGEST_PDF_CHUNK_THRESHOLD",
        "INGEST_PDF_CHUNK_PAGES",
        "INGEST_PDF_OCR_BACKEND",
        "INGEST_MAX_DOWNLOAD_BYTES",
    ):
        if os.getenv(k):
            print(f"- {k}={os.getenv(k)}")

    run_local_sanity(max_chars=args.max_chars, include_ocr=args.include_ocr)

    if not args.no_remote:
        run_remote_sanity(args.urls, max_chars=args.max_chars)


if __name__ == "__main__":
    main()
