# UC contracts sitemap validation

Checked on 2026-09-28 against the live UCnet website. The baseline is the
unchanged Playwright adapter from `7e8d53c5eaa8a90444fbc9acfd876cfc3ec4544b`.
Both runs performed discovery only, with no database or search writes.

| Measure | Existing adapter | Sitemap adapter |
| --- | ---: | ---: |
| Emitted records | 826 | 823 |
| Unique PDF URLs | 820 | 823 |
| Discovery time, seconds | 66.63 | 3.97 |
| Existing URLs lost | | 0 |
| Existing titles changed | | 0 |
| Existing unit metadata associations lost | | 0 |

The sitemap adapter validated 41 units across 60 unit and contract pages. The
comparison inspected every baseline record, including duplicates, to verify
that all keywords, subject areas, and responsible offices survived. Six shared
PDFs now have combined unit metadata and are emitted once. Timing measures one
local run, not a production performance guarantee.

The three additions are:

- [SV complete contract](https://ucnet.universityofcalifornia.edu/wp-content/uploads/2026/09/UAW-SV-Complete-Contract.pdf), linked from the separate Contract tab.
- [RP complete contract](https://ucnet.universityofcalifornia.edu/wp-content/uploads/2026/09/UAW-RP-Complete-Contract.pdf), also linked from a separate Contract tab.
- [DX hours-of-work side letter](https://ucnet.universityofcalifornia.edu/wp-content/uploads/labor/bargaining-units/dx/docs/dx_2015-2019_sla2_hours-of-work-extended-weekdays-and-weekends.PDF), previously missed because its extension is uppercase.

CM explicitly says no agreement has been completed. MR's `contract-mr` tab says
the final document will be posted when available. Both states are recognized;
an otherwise empty contract page fails discovery.

## Verification

- All 106 backend tests passed using the repository's pinned requirements,
  including 33 new contract-source cases. Seven third-party deprecation warnings
  remain. The initial run used outdated local reader packages and failed four
  existing extraction regressions; installing the already-pinned requirements
  resolved those failures without changing dependencies in this branch.
- The tests cover split sitemaps, sitemap-only units, direct local PDFs, campus
  metadata, shared documents, relative/query/uppercase links, omitted pages,
  malformed XML/HTML, retries, and valid unpublished states.
- An integration test uses the real dispatcher, processor, and refresh logic
  with an in-memory database. A contract-page failure records FAILURE, preserves
  `last_updated`, and reaches neither downloading nor vectorization.
- The live comparison command completed without baseline errors and reported
  no URL, title, or metadata coverage regressions.

All three added URLs returned PDF files and completed conversion through the
existing reader with `docling==2.130.0`, `PyMuPDF==1.28.2`, and
`pymupdf4llm==1.28.2`:

| Document | PDF pages | Extracted Markdown characters |
| --- | ---: | ---: |
| SV complete contract | 171 | 395,259 |
| RP complete contract | 174 | 398,694 |
| DX side letter | 1, scanned | 1,446 |

These are full-file conversion smoke checks, not a manual audit of every
extracted provision. The scanned side letter used the existing OCR path.

To repeat the live comparison, see the command and prerequisites in the
[backend README](../README.md#uc-contracts-discovery).

## Limits and rollout

No deployed source was refreshed or reset during this validation. Production
index coverage still needs verification. See the
[backend README](../README.md#uc-contracts-discovery) for discovery failure
handling, coverage limits, and the unchanged-hash metadata caveat.
