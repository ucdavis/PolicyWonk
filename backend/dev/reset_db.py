import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from alembic import command
from alembic.config import Config

load_dotenv()  # This loads the environment variables from .env

# Ensure the connection string is fetched from environment variable
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

# only run on local pg with '@postgres:5432/' in the DATABASE_URL
if '@postgres:5432/' not in DATABASE_URL:
    raise ValueError(
        "This script is only intended to run on the local PostgreSQL database.")

# Create an engine
engine = create_engine(DATABASE_URL)

# Create a configured "Session" class
Session = sessionmaker(bind=engine)

# Create a Session
session = Session()


def reset_database():
    """
    Resets the database to the initial state by performing the following steps:
    1. Downgrades the database to the base version.
    2. Upgrades the database to the latest version.

    This function uses Alembic for database migrations and assumes that the
    Alembic configuration file is named 'alembic.ini'.

    The migration scripts themselves contain INSERT statements to populate a
    minimal set of data (roles, default questions, an assistant, etc).
    """
    alembic_cfg = Config("alembic.ini")
    command.downgrade(alembic_cfg, "base")
    command.upgrade(alembic_cfg, "head")

    print("Database has been reset to the test state.")


if __name__ == "__main__":
    reset_database()
    session.close()
