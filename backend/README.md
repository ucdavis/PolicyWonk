## Setting Up the Database

1. In the terminal, navigate to the `backend` directory.

2. Run `alembic upgrade head` to apply the latest database migrations.

3. (optional) Run `python dev/reset_db.py` to seed the database with some test data (WARNING: removes any old data).

## Installing Dependencies

```bash
pip install -r requirements.txt
```

Optional dev/test deps:

```bash
pip install -r requirements-dev.txt
```

# Browsing / Scraping

Playing with using playwright for browser automation instead of selenium (mostly for ease of setup)

`playwright install chromium` and `playwright install-deps chromium` currently needs to be run before using anything that requires crawling. Eventually will be built into the devcontainer or at least deployment docker images.

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
uv pip install -r requirements.txt
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
python -m pytest tests/test_ucop.py -q
```

The tests mock HTTP and use an in-memory database for worker failure handling.
For a read-only live listing check, `python -m background.sources.ucop` validates
and prints the listing without running the ingestion processor. Deployment,
source resets, and reindexing are separate operations; see
[the deployment guide](../deploy/README.md).
