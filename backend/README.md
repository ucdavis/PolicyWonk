## Setting Up the Database

1. In the terminal, navigate to the `backend` directory.

2. Run `alembic upgrade head` to apply the latest database migrations.

3. (optional) Run `python dev/reset_db.py` to seed the database with some test data (WARNING: removes any old data).

# Browsing / Scraping

Playing with using playwright for browser automation instead of selenium (mostly for ease of setup)

`playwright install chromium` and `playwright install-deps chromium` currently needs to be run before using anything that requires crawling. Eventually will be built into the devcontainer or at least deployment docker images.

```bash
playwright install chromium && playwright install-deps chromium
```
