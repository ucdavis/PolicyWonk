## Setting Up the Database

1. In the terminal, navigate to the `backend` directory.

2. Run `alembic upgrade head` to apply the latest database migrations.

3. (optional) Run `python dev/reset_db.py` to seed the database with some test data (WARNING: removes any old data).

## Installing Dependencies

Use Python 3.12 and uv 0.13.8. `pyproject.toml` defines direct dependencies and
`uv.lock` records resolved versions and artifact hashes. Linux uses CPU-only
PyTorch wheels from its explicit index; other packages resolve from PyPI.
The unused umbrella `langchain` package is removed. The narrow integrations
keep the existing embedding configuration, Elasticsearch 8 client family,
index names, and document metadata. Historical migrations still use pgvector.


```bash
uv sync --locked --no-dev
```

Optional dev/test deps:

```bash
uv sync --locked
```

Run the offline backend tests from `backend`:

```bash
SENTRY_DSN='' HF_HUB_OFFLINE=1 USE_DEV_SETTINGS=true \
ELASTIC_INDEX=policy_vectorstore_offline_v2 PYTHONPATH=. \
uv run --no-sync pytest tests -q --disable-socket --allow-unix-socket
```

Every worker Docker build, including PR CI, runs this suite with network sockets disabled
before producing the runtime image. Dev/test dependencies stay in the test stage.
No live ingestion, embeddings, migrations, or index changes run during tests.

To update dependencies, edit `pyproject.toml`, run `uv lock`, then `uv sync --locked`
and the offline suite above. Commit both the manifest and lock. Use
`uv lock --check` to detect stale locks; do not regenerate dependencies during a
release build. The lock covers supported Python 3.12 environments, including
Linux CPU wheels and local macOS development.

The [policy reader fixtures](tests/fixtures/ingestion/README.md) cover real PDF
and Word documents, source-text coverage, and table amounts with footnotes.

# Browsing / Scraping

Playing with using playwright for browser automation instead of selenium (mostly for ease of setup)

Install Chromium and its system dependencies for adapters that use Playwright.
The [UC contracts adapter](#uc-contracts-discovery) uses HTTP requests and does
not require a browser. Its comparison command still needs Chromium to run the
old adapter.

```bash
playwright install chromium && playwright install-deps chromium
```

# Fun with LLMs

Pack up the backend with repomix to get a full representation of the backend codebase.

```bash
npx repomix backend --ignore "experiments/,.env"
```

# Running locally (outside of devcontainer)

First time, create a venv

```bash
uv venv --python 3.12
```

Activate the venv

```bash
source .venv/bin/activate
```

Weird dependency issue w/ psycopg -- I needed to point to my openssl before running pip install

```bash
export LDFLAGS="-L/opt/homebrew/opt/openssl@3/lib -L/opt/homebrew/opt/libpq/lib"
export CPPFLAGS="-I/opt/homebrew/opt/openssl@3/include -I/opt/homebrew/opt/libpq/include"
export PKG_CONFIG_PATH="/opt/homebrew/opt/openssl@3/lib/pkgconfig:/opt/homebrew/opt/libpq/lib/pkgconfig"
```

Install dependencies

```bash
uv sync --locked --no-dev
```

Install playwright browsers (so that it is installed in the venv)

```bash
python -m playwright install chromium
```

Now you can run stuff (from `backend`) e.g.

```bash
python -m background.sources.ucd
```

## Browsing

Locally you can set headless=False in `backend/background/sources/shared.py` to see the browser window when browsing

## UCOP policy listing

The UCOP adapter reads the public listing API at
`https://policyapi.ucop.edu/php-app/?action=welcome&op=browse&api=1&p=1&all=1`.
The UCOP source's saved URL is descriptive; existing `advanced-search.php`
source records work without a database edit. The adapter always requests the
fixed API endpoint and does not follow listing redirects.

Before yielding any documents, it requires a nonempty listing with
`all_entries = 1`, a matching `num_results`, no remaining page links, valid
record fields, and unique document URLs. An incomplete or malformed response
raises an error so the existing worker records FAILURE, leaves `last_updated`
unchanged, and applies its normal retry/backoff and source-disable rules.
It does not hardcode the current catalog size.

Document URLs retain their `https://policy.ucop.edu/doc/<id>` identity. Metadata
keeps the existing keys, with API date strings preserved and null dates mapped
to empty strings. Downloads, content hashing, and indexing use the existing
processor.

Run the offline tests from `backend` after installing the dev dependencies:

```bash
SENTRY_DSN='' HF_HUB_OFFLINE=1 USE_DEV_SETTINGS=true \
ELASTIC_INDEX=policy_vectorstore_offline_v2 PYTHONPATH=. \
uv run --no-sync pytest tests/test_ucop.py -q --disable-socket --allow-unix-socket
```

The tests mock HTTP and use an in-memory database for worker failure handling.
For a read-only live listing check, `python -m background.sources.ucop` validates
and prints the listing without running the ingestion processor. Deployment,
source resets, and reindexing are separate operations; see
[the deployment guide](../deploy/README.md).

## UC contracts discovery

The UC contracts adapter reads UCnet's `sitemap_index.xml` and all advertised
`page-sitemap*.xml` files. It discovers unit home pages and contract tabs,
including names such as `contract-mr`, without launching a browser. About and
news pages and the sitewide PDF library are outside this source's scope.

The main bargaining-unit listing supplies existing unit names and campus
metadata. Units found only in the sitemap use their own page heading and campus
label. Local agreements with PDFs directly on the unit page remain included.
Document URLs and filename-based titles retain their existing identities;
uppercase PDF extensions and query strings are supported. Shared URLs are
emitted once with all unit keywords, subject areas, and responsible offices
retained. For structured unit associations, unchanged-content metadata updates,
and existing-document backfills, see the
[bargaining-unit catalog guide](../docs/bargaining-unit-catalog.md).

Before yielding documents, the adapter checks every discovered unit and contract
page, compares the main listing and unit contract tabs with the sitemap, and requires PDFs or
an explicit notice that the agreement is not published yet. Invalid, missing,
unexpectedly empty, or failed responses raise `UcnetListingError`. The existing
worker then records FAILURE without advancing `last_updated`. Its normal retry
and eventual source-disable rules still apply. New upstream wording or layout
can therefore require an adapter update instead of silently reducing coverage.
Sitemaps have no authoritative total, so these cross-checks cannot detect a unit
removed from both the sitemap and every checked navigation page.

Run the offline source tests from `backend`:

```bash
SENTRY_DSN='' HF_HUB_OFFLINE=1 USE_DEV_SETTINGS=true \
ELASTIC_INDEX=policy_vectorstore_offline_v2 PYTHONPATH=. \
uv run --no-sync pytest tests/test_collective_bargaining.py -q --disable-socket --allow-unix-socket
```

A live discovery comparison runs the old adapter from a trusted Git revision
and the current one. It compares URLs, titles, and every original unit metadata
association, refuses a baseline with logged errors, and saves both manifests.
It performs no database, embedding, or search writes. This command uses the
pre-change adapter at `7e8d53c` and requires Chromium for that baseline only:

```bash
SENTRY_DSN='' PYTHONPATH=. python -m experiments.compare_uc_contracts \
  --baseline-ref 7e8d53c --output /tmp/uc-contracts-comparison.json
```

The adapter alone can be checked with `python -m background.sources.collective_bargaining`.
See [the initial comparison](experiments/uc_contracts_sitemap_validation.md) for
live coverage and extraction evidence. Discovery does not prove production
indexing; deployment and a normal worker refresh remain separate steps.
