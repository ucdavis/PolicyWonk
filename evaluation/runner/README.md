# PolicyWonk model comparison

A small, resumable offline comparison using the application's retrieval, prompt,
OpenAI SDK, and citation transform. No hosted evaluation service, production
writes, or deployment is involved. The older Python/DeepEval experiment elsewhere
in `evaluation/` is independent.

## Setup

From the repository root:

```sh
npm ci --prefix web
(cd web && npx prisma generate)
npm ci --prefix evaluation/runner
python3 -m venv evaluation/runner/.venv
evaluation/runner/.venv/bin/pip install -r evaluation/runner/requirements.txt
az login
```

The launcher reads Azure settings into child-process memory. It uses production's
read-only search credentials, document database and embedding model, and test's
OpenAI key and US endpoint. Subscription/app names are explicit in `sample.py`
and `launch.py`; check them before reuse in another environment. Azure settings
permission is required. Keys are never written into output files.

## Sample and review

Choose a private directory outside the repository. The examples use `$RUN`:

```sh
RUN="$HOME/Documents/Codex/policywonk-evaluation/my-run"
evaluation/runner/.venv/bin/python evaluation/runner/sample.py --out "$RUN" --candidates 130
```

This reads the latest saved active PolicyWonk chats in a read-only transaction.
It selects the first user question, preserves group/focus, normalizes whitespace,
and deduplicates case-insensitively within scope. The bounded query examines at
most 3,000 chats. Obvious identifiers, greetings and very long pasted text are
excluded locally. It does **not** send candidate questions to a model.

Review every row in `review.jsonl` locally. Regex filtering cannot reliably detect
names or sensitive personal situations. Generalize a question only if its policy
meaning survives; otherwise set `decision` to `exclude`, add a short `reason`,
and clear `question` so discarded personal text is not retained. For safe rows,
set `decision` to `approved` and add `reviewedBy`. Do not bulk-approve unseen rows.
No separate API call is used for privacy screening.

```sh
evaluation/runner/.venv/bin/python evaluation/runner/launch.py sample --dir "$RUN" --count 100
```

This freezes the newest 100 approved questions plus 10 fictional edge cases.
The runner rejects changed text without matching privacy approval and a matching
dataset fingerprint. To edit an already frozen sample, review again and create a
new dataset directory. The dataset hash is integrity checking, not encryption.

## Pilot, then full run

```sh
evaluation/runner/.venv/bin/python evaluation/runner/launch.py prepare --dir "$RUN" --limit 10
evaluation/runner/.venv/bin/python evaluation/runner/launch.py run --dir "$RUN" --limit 10 --budget 50
# Inspect report.html, API failures, sources and token counts before continuing.
evaluation/runner/.venv/bin/python evaluation/runner/launch.py prepare --dir "$RUN" --budget 50
evaluation/runner/.venv/bin/python evaluation/runner/launch.py run --dir "$RUN" --budget 50 --concurrency 3
```

`prepare` reads production Elasticsearch and document content using the app's
actual functions. Database sessions are configured read-only. It embeds only
reviewed questions via `https://us.api.openai.com/v1`. Retrieved public policy
text and the exact system prompt are then frozen. `run` does not save chats or
contact the production website. All model requests set `store: false`.

The comparison is **gpt-5.2 medium**, **gpt-5.6-terra medium**, and
**gpt-5.6-terra low** on the current application code. It does not compare a new
model plus new code against the older deployed production implementation. The
runner caps output at 8,192 tokens and treats truncation as failure; the website
does not currently set this cap. Only isolated saved questions are replayed,
not full conversation history.

Completed calls are cached by question, sources, code, endpoint, settings and
variant. Judge changes have their own fingerprint, so updating a judge does not
regenerate valid answers. Resuming the same command reuses them; `--retry-errors true` explicitly
retries cached errors. Unknown failed-call costs remain reserved. A conservative
per-call reservation prevents dispatch above `--budget` (USD, cumulative for the
directory); a long prompt can stop dispatch before actual spend reaches the cap.
The estimate is not an OpenAI billing statement. Embedding costs are conservative
estimates. A `.runner.lock` prevents concurrent writers; after a crash, verify
that its PID is no longer running before removing the lock. Use a new directory
when retrieval code or dataset changes. Do not edit runner code during a run.

## Results and review

`report.html` is self-contained; `summary.json`, `results/`, `contexts/`,
`run-manifest.json`, and `ledger.json` provide machine-readable evidence. Rebuild:

```sh
evaluation/runner/.venv/bin/python evaluation/runner/launch.py report --dir "$RUN"
```

Generation metrics: time to first visible text, total median/p95 latency,
completion/failure counts, input/output/cached/reasoning tokens, estimated cost,
and invalid citation numbers. Latency excludes retrieval and website/auth/network
startup. Hidden reasoning is billed within output tokens, not added twice.
Prices in `core.mjs` are dated and include the applicable US endpoint uplift;
refresh them before future runs, especially after a promotion ends.

A fixed `gpt-5.6-sol` low-reasoning judge sees anonymized, shuffled A/B answers and
scores relevance, completeness, grounding, citation support and uncertainty. It
flags unsupported consequential claims and insufficient retrieval evidence.
These judgments are an aid to review, not gold labels or proof of correctness. The judge receives the exact merged
document text and citation numbers used by generation.
Review every severe flag and at least 10 seeded random examples against the
frozen documents. A domain owner should confirm consequential policy judgments.
The production sample is recent and repetitive, excludes unsaved failures, and
is not a traffic-weighted or comprehensive benchmark.

For close or surprising comparisons, reverse answer order without regenerating:

```sh
evaluation/runner/.venv/bin/python evaluation/runner/launch.py recheck --dir "$RUN" --ids q001,q002 --budget 50
```

`summary.json.rechecks` records winner stability. This tests judge sensitivity to
answer order; it does not measure model generation variability. For that, run a
separate directory with the same reviewed dataset and frozen contexts.

No automatic model switch is performed. Prefer a candidate only after quality
review, successful completions, and an acceptable latency/cost tradeoff. Treat
shared retrieval gaps as a separate issue. Keep a small fixed benchmark, append
new reviewed cases periodically, and rerun before model/prompt/retrieval changes.

## Tests and data handling

```sh
npm test --prefix evaluation/runner
evaluation/runner/.venv/bin/python -m unittest discover -s evaluation/runner -p '*_test.py'
```

Raw candidates and even reviewed questions are private local artifacts. Do not
commit or attach them to PRs. The default `evaluation/runs/` and JSONL outputs are
ignored; prefer a directory outside the checkout. Files are created with owner-
only permissions. Retain only the reviewed benchmark and results you need;
remove candidate review files when no longer needed. Keep secrets out of shell
arguments, source control, screenshots and prompts.
