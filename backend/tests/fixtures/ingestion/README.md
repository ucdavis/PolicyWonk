# Policy reader regression samples

These nine public source documents were downloaded on September 22, 2026
during the ingestion investigation. They are fixed test inputs, not a current
policy reference. `manifest.json` records the source URLs, download date,
SHA-256 checksums, and a few required passages for each file.

| Sample | Reason to keep it |
| --- | --- |
| UCOP Abusive Conduct | Long prose, definitions, and translation links |
| UCOP G-28 Travel | 54-page policy with tables and a detailed PDF outline |
| UCOP Personal Leave | Short policy with an explicit employee scope |
| UCOP Religious Holiday Move-In | Short PDF without a native outline |
| UCOP G-41 Non-Cash Awards | Dollar amounts next to superscript footnotes |
| UCD Performance Management | Native DOCX control with nested procedures |
| UCD Integrity in Research | Native DOCX whose nested lists lost 22 paragraphs |
| UCD Chemical Safety | Numbered PDF sections and policy cross-references |
| UCD DA 2629 Capital Project Matters | Landscape tables and a scanned signature |

The tests run the application's reader without crawling, embedding, or writing
to a database or search index. They compare meaningful text, not complete
Markdown snapshots. DOCX coverage is checked against the independent source
XML. The awards test checks that $315 and footnotes 2/3 do not become $3152 or
$3153 and that the effective-date note survives.

From `backend`, after installing `requirements-dev.txt`:

```bash
SENTRY_DSN='' HF_HUB_OFFLINE=1 PYTHONPATH=. python -m pytest tests -q
```

These samples contain extractable PDF text and native Word content. They do not
exercise scanned-only OCR or prove retrieval/answer quality. Section-aware
chunking, improved metadata, and reindexing are separate changes.
