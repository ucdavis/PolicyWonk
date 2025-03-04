import os
from dotenv import load_dotenv
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session

load_dotenv()  # This loads the environment variables from .env

# Dictionary to store engines for different database URLs
_db_engines: dict[str, Engine] = {}


def get_default_db_url() -> str:
    # Ensure the connection string is fetched from environment variable
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable not set")
    return DATABASE_URL


def get_db_engine(db_url: str = None) -> Engine:
    if db_url is None:
        db_url = get_default_db_url()

    if db_url not in _db_engines:
        _db_engines[db_url] = create_engine(db_url)

    return _db_engines[db_url]


def get_session(db_url: str = None) -> Session:
    return Session(bind=get_db_engine(db_url))
