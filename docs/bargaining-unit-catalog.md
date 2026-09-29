# Bargaining-unit catalog

Union choices come from searchable contract chunks rather than a frontend list.
The authenticated `/api/unions?group=ucdavis` route and server-side chat/link
validation share a five-minute, process-local catalog cache. Concurrent requests
share one refresh. An expired cache that cannot refresh returns an explicit error;
failed loads are retried on the next request. Each process refreshes independently.

## Metadata and campus rules

UCnet ingestion stores `bargaining_units` in each document's JSON metadata and
copies it to its search chunks. Each entry keeps a code, display name, and campus
list together, for example:

```json
[
  {"code": "SV", "name": "Student Services and Advising Professionals", "campuses": ["all"]},
  {"code": "K3", "name": "Skilled Craft", "campuses": ["ucdavis"]}
]
```

The selector shows systemwide entries plus the selected campus's entries. UCOP
shows systemwide entries only. Current supported campus groups are `ucdavis`,
`ucb`, and `ucsf`. Other UC campuses are represented in ingestion metadata for
future group support. Unknown UCnet campus labels fail listing validation instead
of being treated as systemwide. Adding a bargaining unit requires no frontend
edit; adding an app campus still requires adding that group to the app.

The catalog aggregates document URLs and reads intact association objects from
one indexed chunk per document. It does not aggregate parallel code, name, and
campus arrays, so shared PDFs cannot create false associations. Only chunks with
text, vectors, structured associations, and the unit keyword used by retrieval
contribute choices. Composite pagination avoids dropping units at a bucket limit;
timeouts, shard failures, malformed metadata, and pagination failures are errors.

Search retains the existing uppercase-code keyword and contract-source filters
for both supported index formats. The metadata backfill command targets the
current v2 worker/index format. A legacy index needs equivalent structured
metadata before it can supply a catalog; it does not fall back to a static list.

Historical documents stay indexed. Once they have explicit associations, they
continue to support catalog entries while searchable, even if no longer in the
current source listing. Historical documents without those associations are not
used to invent catalog entries; existing code-based retrieval can still find
them. Saved chat descriptions are read from their saved metadata without a
catalog lookup. New links and submissions validate against current availability;
an unavailable union displays an error instead of silently selecting another
search scope.

## Metadata migration and rollout

Normal contract refreshes update source-owned metadata even when the stored text
hash is unchanged. Only `bargaining_units`, `keywords`, `subject_areas`, and
`responsible_office` change. Text, embeddings, hashes, titles, and timestamps are
preserved. Index updates are scoped by source and URL and reject a mismatching
content hash. Database metadata is committed only after a successful index
update. A failed or partially applied update is safe to retry. New or changed
text continues through the existing vectorization path.

An individual metadata failure is logged with its URL and its database transaction
is rolled back. Normal ingestion continues through the remaining batches, then
records the source attempt as failed. The existing retry/backoff and three-failure
source-disable policy still applies; partial work never advances `last_updated`.

The backfill is a manual migration or repair command, not a scheduled task.
For an initial backfill, run from `backend` with the intended environment's
existing credentials. Inspect the dry run first:

```sh
python -m dev.backfill_contract_catalog --expect-index policy_vectorstore_test_v2
python -m dev.backfill_contract_catalog --expect-index policy_vectorstore_test_v2 --apply
```

The command validates the existing UCnet listing before writing, updates only
already stored current-listing documents, downloads no PDFs, and never generates
embeddings. It reconciles indexed metadata even when the database is already
migrated, then refreshes the index. URLs absent from the listing are left intact;
missing DB documents are reported rather than created. The exact index guard
prevents accidentally using a different configured index.

The backfill also continues after individual failures, refreshes the index, and
prints its JSON report before exiting nonzero if any update or final index
refresh failed, including shard failures in an otherwise successful response.
The `failed` list identifies affected URLs; `refresh_error` records the final
index-refresh error and any returned shard failure details. `updated_chunks`
counts successful updates, not partial writes from failed requests. Correct the
reported problem and rerun the same command to
reconcile partial work. Listing validation still fails before any writes.

Run the TEST backfill and check indexed catalog availability before releasing the
frontend. The production backfill and deployment require separate approval.
For production, use the production index explicitly only after that approval.
No SQL schema migration, new service, or index replacement is needed.

## Validation

Offline coverage exercises source discovery, shared-PDF associations, unknown
campus labels, unchanged-content migration, partial failure/retry, cache refresh,
new units, endpoint authentication, campus scoping, validation/UI agreement,
SV/RP links, legacy/v2 search filters, and saved-history descriptions.

```sh
cd backend
USE_DEV_SETTINGS=true SENTRY_DSN='' .venv/bin/python -m pytest tests/test_collective_bargaining.py tests/test_contract_metadata.py -q
cd ../web
npm test
npx tsc --noEmit
```

Live evidence belongs in the development verification report. The earlier
contracts discovery/release reports remain the authority for PRs 178 and 179;
this change does not repeat their production verification.
