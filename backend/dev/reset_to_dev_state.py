# reset the db to the dev state with

import os
from dotenv import load_dotenv
from db.models import Source
from dev.reset_db import reset_database

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

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


def reset_to_dev_state():
    # first full reset
    reset_database()

    # now insert a sample source
    # UCOP but just the fist page
    source = Source(
        name="UCOP Policies Page 1",
        url="https://policy.ucop.edu/advanced-search.php?action=welcome&op=browse",
        type="UCOP",
        status="ACTIVE",
        refresh_frequency="DAILY",
    )

    session.add(source)

    session.commit()
    print("Database has been reset to the dev state.")
    session.close()


if __name__ == "__main__":
    reset_to_dev_state()
