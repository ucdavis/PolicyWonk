
import os

from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from langchain_elasticsearch import ElasticsearchStore
from langchain_openai import AzureOpenAIEmbeddings, OpenAIEmbeddings
from langchain_core.embeddings import FakeEmbeddings
from pydantic import SecretStr

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
LLM_EMBEDDING_MODEL = os.getenv("LLM_EMBEDDING_MODEL", "text-embedding-3-small")
LLM_EMBEDDINGS_CHUNK_SIZE = int(os.getenv("LLM_EMBEDDINGS_CHUNK_SIZE", "64"))

USE_DEV_SETTINGS = os.getenv("USE_DEV_SETTINGS", "false").lower() == "true"
FAKE_EMBEDDINGS_SIZE = int(os.getenv("FAKE_EMBEDDINGS_SIZE", "1536"))

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT = os.getenv(
    "AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT",
    os.getenv("AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME", ""),
)
USE_AZURE_EMBEDDINGS = bool(
    AZURE_OPENAI_ENDPOINT
    and AZURE_OPENAI_API_KEY
    and AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT
    and not USE_DEV_SETTINGS
)
USE_OPENAI_EMBEDDINGS = bool(LLM_API_KEY and LLM_EMBEDDING_MODEL and not USE_DEV_SETTINGS)

# Create our elastic client
es_client = Elasticsearch(
    hosts=[ELASTIC_URL],
    basic_auth=(ELASTIC_WRITE_USERNAME, ELASTIC_WRITE_PASSWORD),
    max_retries=10,
    retry_on_timeout=True,
)

if USE_AZURE_EMBEDDINGS:
    embeddings = AzureOpenAIEmbeddings(
        model=LLM_EMBEDDING_MODEL,
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
        api_key=SecretStr(AZURE_OPENAI_API_KEY),
        azure_deployment=AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT,
        chunk_size=LLM_EMBEDDINGS_CHUNK_SIZE,
    )
elif USE_OPENAI_EMBEDDINGS:
    embeddings = OpenAIEmbeddings(
        model=LLM_EMBEDDING_MODEL,
        api_key=SecretStr(LLM_API_KEY),
        chunk_size=LLM_EMBEDDINGS_CHUNK_SIZE,
    )
else:
    if not USE_DEV_SETTINGS and not (LLM_API_KEY and LLM_EMBEDDING_MODEL):
        logger.warning(
            "No LLM_API_KEY or LLM_EMBEDDING_MODEL environment variables found. Using fake embeddings."
        )
    embeddings = FakeEmbeddings(size=FAKE_EMBEDDINGS_SIZE)


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


def ensure_elasticsearch_index() -> bool:
    """
    Ensure the Elasticsearch index exists with the expected vector store mappings.
    """
    try:
        exists = es_client.indices.exists(index=ELASTIC_INDEX)
        if exists.meta.status == 200:
            logger.info(f"Elasticsearch index {ELASTIC_INDEX} already exists")
            return True
    except Exception as e:
        logger.warning(f"Failed to check index {ELASTIC_INDEX} existence: {e}")

    try:
        store = ElasticsearchStore(
            embedding=embeddings,
            index_name=ELASTIC_INDEX,
            es_connection=es_client,
        )
        store.add_texts([], create_index_if_not_exists=True)
        logger.info(f"Created Elasticsearch index {ELASTIC_INDEX}")
        return True
    except Exception as e:
        logger.error(f"Failed to create Elasticsearch index {ELASTIC_INDEX}: {e}")
        return False


def verify_elasticsearch_index_mapping() -> bool:
    """
    Verify that the Elasticsearch index has the required mappings for vector search.
    """
    try:
        mappings = es_client.indices.get_mapping(index=ELASTIC_INDEX)
        index_mapping = mappings.get(ELASTIC_INDEX, {}).get("mappings", {})
        properties = index_mapping.get("properties", {})

        vector_mapping = properties.get("vector")
        if not vector_mapping:
            logger.warning(
                f"Elasticsearch index {ELASTIC_INDEX} missing required field: vector"
            )
            return False

        if vector_mapping.get("type") != "dense_vector":
            logger.warning(
                f"Elasticsearch index {ELASTIC_INDEX} has unexpected vector type: {vector_mapping.get('type')}"
            )
            return False

        dims = vector_mapping.get("dims")
        if not isinstance(dims, int) or dims <= 0:
            logger.warning(
                f"Elasticsearch index {ELASTIC_INDEX} has invalid vector dims: {dims}"
            )
            return False

        # These are typically created via dynamic mappings on first ingest when using
        # elasticsearch.helpers.vectorstore.DenseVectorStrategy.
        missing_optional_fields = [
            field for field in ("text", "metadata") if field not in properties
        ]
        if missing_optional_fields:
            logger.info(
                f"Elasticsearch index {ELASTIC_INDEX} does not yet have fields: {missing_optional_fields}"
            )

        logger.info(
            f"Elasticsearch index {ELASTIC_INDEX} mappings look healthy (vector dims={dims})"
        )
        return True
    except Exception as e:
        logger.error(f"Failed to verify mappings for {ELASTIC_INDEX}: {e}")
        return False
