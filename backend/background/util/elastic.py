
import os

from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from langchain_openai import OpenAIEmbeddings
from langchain_core.embeddings import FakeEmbeddings

from background.logger import setup_logger
load_dotenv()  # This loads the environment variables from .env

logger = setup_logger()

# Setup for Elasticsearch
ELASTIC_URL = os.getenv("ELASTIC_URL", "http://127.0.0.1:9200")
ELASTIC_WRITE_USERNAME = os.getenv("ELASTIC_WRITE_USERNAME", "")
ELASTIC_WRITE_PASSWORD = os.getenv("ELASTIC_WRITE_PASSWORD", "")
ELASTIC_INDEX = os.getenv("ELASTIC_INDEX", "vectorstore_test")

# Setup for Embeddings
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_EMBEDDING_MODEL = os.getenv("LLM_EMBEDDING_MODEL", "")

USE_DEV_SETTINGS = os.getenv("USE_DEV_SETTINGS", "false").lower() == "true"

# Create our elastic client
es_client = Elasticsearch(
    hosts=[ELASTIC_URL],
    basic_auth=(ELASTIC_WRITE_USERNAME, ELASTIC_WRITE_PASSWORD),
    max_retries=10,
    retry_on_timeout=True,
)

if USE_DEV_SETTINGS:
    embeddings = FakeEmbeddings(size=4096)
else:
    # In prod use openAI embeddings
    embeddings = OpenAIEmbeddings(
        model=LLM_EMBEDDING_MODEL,
        api_key=LLM_API_KEY,
    )


def verify_elasticsearch():
    """
    Verify that the Elasticsearch connection is working.
    """
    try:
        es_client.ping()
        logger.info("Elasticsearch connection successful")
        return True
    except Exception as e:
        logger.error(f"Elasticsearch connection failed: {e}")
        return False