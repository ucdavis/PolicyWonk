from datetime import datetime, timezone
import os

from dotenv import load_dotenv
from langchain_core.embeddings import FakeEmbeddings
from langchain_elasticsearch import ElasticsearchStore
from langchain_openai import OpenAIEmbeddings
from pydantic import SecretStr
from background.util.elastic import ELASTIC_INDEX, es_client
from background.logger import setup_logger
from db.models import Document, DocumentContent, Source
from db.mutations import delete_doc_content
from models.document_details import DocumentDetails
from sqlalchemy.orm import Session
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

load_dotenv()

logger = setup_logger()

# make sure we have the necessary environment variables
# LLM_API_EMBEDDING_URL = os.getenv("LLM_API_EMBEDDING_URL")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_EMBEDDING_MODEL = os.getenv("LLM_EMBEDDING_MODEL", "")
USE_REAL_EMBEDDINGS = bool(LLM_API_KEY and LLM_EMBEDDING_MODEL)

if not USE_REAL_EMBEDDINGS:
    logger.warning(
        "No LLM_API_KEY or LLM_EMBEDDING_MODEL environment variables found. Using fake embeddings.")

# Markdown headers we want to split on
HEADER_CONFIG = [("#", "h1"), ("##", "h2"), ("###", "h3")]


def vectorize_document(session: Session, source: Source, document_details: DocumentDetails, db_document: Document | None):
    # we want to re-vectorize the document if it has changed, or otherwise create new
    # 1. chunk the content
    # 2. vectorize the chunks
    # 3. remove any existing content or chunks related to the doc
    # 4. store the new content and vectors
    # 5. return the updated db document

    # 1. We're going to use langchain to chunk using the content (assuming it's markdown)
    # https://python.langchain.com/docs/how_to/markdown_header_metadata_splitter/
    # first we split the content into headers and content
    markdown_splitter = MarkdownHeaderTextSplitter(
        HEADER_CONFIG, strip_headers=False)
    md_header_splits = markdown_splitter.split_text(
        document_details.content)

    # now we need to chunk the content into smaller pieces so it can be vectorized
    text_splitter = RecursiveCharacterTextSplitter()

    chunks = text_splitter.split_documents(md_header_splits)

    # Add parent/document-level metadata to each chunk so it is stored in Elasticsearch.
    parent_metadata = dict(document_details.metadata or {})
    parent_metadata.setdefault("doc_length", parent_metadata.get(
        "content_length", len(document_details.content or "")))
    parent_metadata.setdefault("doc_tokens", parent_metadata.get(
        "token_count", parent_metadata.get("tokens", 0)))
    parent_metadata.setdefault("url", document_details.url)
    parent_metadata.setdefault("title", document_details.title)

    for chunk in chunks:
        chunk_meta = dict(getattr(chunk, "metadata", None) or {})
        # Merge in document-level metadata without dropping existing chunk/header keys.
        chunk_meta.update(parent_metadata)
        chunk.metadata = chunk_meta

    # log the chunks
    logger.info(
        f"Document {document_details.url} has {len(chunks)} chunks")

    # 2. vectorize the chunks
    if USE_REAL_EMBEDDINGS:
        embeddings = OpenAIEmbeddings(
            model=LLM_EMBEDDING_MODEL, api_key=SecretStr(LLM_API_KEY))
    else:
        embeddings = FakeEmbeddings(size=1536)

    store = ElasticsearchStore(
        embedding=embeddings,
        index_name=ELASTIC_INDEX,
        es_connection=es_client,
    )

    # delete any existing vectors for this doc
    delete_by_url(source.id, document_details.url)

    # add the new vectors for the doc
    # should be ok without batching since we are doing per doc
    store.add_documents(chunks)

    # 3. remove any existing content related to the doc
    if db_document:
        delete_doc_content(session, db_document)

    doc_content = DocumentContent(content=document_details.content)

    # get the metadata for this doc
    metadata = document_details.metadata or {}

    # 5. update the db document info
    if not db_document:
        db_document = Document()

    db_document.title = document_details.title
    db_document.source_id = source.id
    db_document.last_updated = datetime.now(timezone.utc)
    db_document.url = document_details.url
    db_document.meta = metadata

    # add the doc to elastic
    session.add(db_document)

    # now that we've flushed the changes and have a docId we can continue
    db_document.content = doc_content

    return db_document


def group_headers(metadata: dict) -> dict:
    """
    Groups specific headers from the metadata dictionary into a single "headers" key.

    This function extracts values from the metadata dictionary based on keys defined
    in HEADER_CONFIG. It then creates a new dictionary excluding these keys and adds
    a "headers" key containing the extracted values if any are found.

    Args:
        metadata (dict): The metadata dictionary containing various key-value pairs.

    Returns:
        dict: A new dictionary with the specified headers grouped under the "headers" key,
              and the remaining key-value pairs from the original metadata.
    """
    # Extract header keys (second elements) from HEADER_CONFIG tuples
    header_keys = [key for _, key in HEADER_CONFIG]
    headers = []
    for key in header_keys:
        if key in metadata:
            headers.append(metadata[key])
    # Build new dictionary excluding header keys
    new_meta = {k: v for k, v in metadata.items() if k not in header_keys}
    if headers:
        new_meta["headers"] = headers
    return new_meta


def delete_by_url(source_id: int, url: str) -> dict:
    """
    Delete document from Elasticsearch by URL and source ID.

    Args:
        source_id (int): The source ID to filter by
        urls (List[str]): List of URLs to delete

    Returns:
        dict: Result of the deletion operation
    """
    if not url:
        return {"deleted": 0}

    result = es_client.delete_by_query(
        index=ELASTIC_INDEX,
        conflicts="proceed",  # continue deleting even if there are version conflicts
        body={
            "query": {
                "bool": {
                    "must": [
                        {"term": {"metadata.url.keyword": url}},
                        {"term": {"metadata.source_id": source_id}}
                    ]
                }
            }
        }
    )

    return {"deleted": result.get("deleted", 0)}
