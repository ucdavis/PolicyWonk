"""Reader regressions using fixed public policy documents, without indexing."""
from functools import lru_cache
import hashlib
import html
import json
from pathlib import Path
import re
import unicodedata
from xml.etree import ElementTree
from zipfile import ZipFile

import pytest

from background.sources.ingestion import ingest_path_to_markdown_sync


FIXTURES = Path(__file__).parent / "fixtures" / "ingestion"
SAMPLES = json.loads((FIXTURES / "manifest.json").read_text())
WORD_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def normalize(text):
    # Compare content rather than Markdown layout or hyperlink destinations.
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unicodedata.normalize("NFKC", html.unescape(text)).casefold()
    return "".join(character for character in text if character.isalnum())


@lru_cache(maxsize=None)
def converted(filename):
    return ingest_path_to_markdown_sync(str(FIXTURES / filename))


@pytest.mark.parametrize("sample", SAMPLES, ids=lambda sample: sample["file"])
def test_policy_content_survives_conversion(sample):
    path = FIXTURES / sample["file"]
    assert hashlib.sha256(path.read_bytes()).hexdigest() == sample["sha256"]
    text = normalize(converted(sample["file"]))
    for required in sample["required_text"]:
        assert normalize(required) in text, f"Missing policy text: {required}"


@pytest.mark.parametrize("filename", [
    "ucd-integrity-in-research.docx",
    "ucd-performance-management.docx",
])
def test_word_paragraphs_are_not_silently_dropped(filename):
    # The old reader lost 22 real paragraphs in Integrity in Research. Read
    # independent source XML so the expected content cannot inherit its bug.
    with ZipFile(FIXTURES / filename) as document:
        source = ElementTree.fromstring(document.read("word/document.xml"))
    # Only w:t contains displayed paragraph text; ignore field instructions.
    paragraphs = [
        "".join(node.text or "" for node in paragraph.findall(".//w:t", WORD_NS))
        for paragraph in source.findall(".//w:body//w:p", WORD_NS)
    ]
    text = normalize(converted(filename))
    missing = [
        paragraph for paragraph in paragraphs
        if len(normalize(paragraph)) >= 15 and normalize(paragraph) not in text
    ]
    assert not missing, "Source paragraphs missing from conversion:\n" + "\n".join(missing)


@pytest.mark.parametrize("label", ["One-month parking permit", "One-month transit pass"])
def test_award_amount_is_not_combined_with_footnote(label):
    markdown = converted("ucop-non-cash-awards.pdf")
    rows = [line for line in markdown.splitlines() if normalize(label) in normalize(line)]
    assert rows, f"Missing award table row: {label}"
    assert any(re.search(r"\$315(?![0-9])", row) for row in rows), rows
    assert not any(re.search(r"\$315[23]\b", row) for row in rows), rows
    assert "effective112024" in normalize(markdown), "Missing effective-date footnote"
