## Setting Up the Database

1. In the terminal, navigate to the `backend` directory.

2. Run `alembic upgrade head` to apply the latest database migrations.

3. (optional) Run `python dev/reset_db.py` to seed the database with some test data (WARNING: removes any old data).

## Installing Dependencies

```bash
pip install -r requirements.txt
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

Install dependencies

```bash
uv pip install -r requirements.txt
```

Install playwright browsers (so that it is installed in the venv)

```bash
python -m playwright install chromium
```

Weird dependency issue w/ psycopg -- I needed to point to my openssl before running above

```bash
export LDFLAGS="-L/opt/homebrew/opt/openssl@3/lib -L/opt/homebrew/opt/libpq/lib"
export CPPFLAGS="-I/opt/homebrew/opt/openssl@3/include -I/opt/homebrew/opt/libpq/include"
export PKG_CONFIG_PATH="/opt/homebrew/opt/openssl@3/lib/pkgconfig:/opt/homebrew/opt/libpq/lib/pkgconfig"
```

## Browsing

Locally
