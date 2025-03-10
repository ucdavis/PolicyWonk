from datetime import datetime, timezone
import os

from dotenv import load_dotenv
from langchain_core.embeddings import FakeEmbeddings
from langchain_openai import OpenAIEmbeddings
from pydantic import SecretStr
from background.logger import setup_logger
from db.models import Document, DocumentChunk, DocumentContent, Source
from db.mutations import delete_chunks_and_content
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
    # langchain uses character sizes so token sizes are about 1/4 the character size
    chunk_size_in_tokens = 500
    chunk_overlap_in_tokens = 50
    chunk_size = chunk_size_in_tokens * 4
    chunk_overlap = chunk_overlap_in_tokens * 4
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )

    chunks = text_splitter.split_documents(md_header_splits)

    # log the chunks
    logger.info(
        f"Document {document_details.url} has {len(chunks)} chunks")

    # 2. vectorize the chunks
    if USE_REAL_EMBEDDINGS:
        embeddings = OpenAIEmbeddings(
            model=LLM_EMBEDDING_MODEL, api_key=SecretStr(LLM_API_KEY))
    else:
        embeddings = FakeEmbeddings(size=1536)

    # mass embeddings for all chunks
    embedded_vectors = embeddings.embed_documents(
        [chunk.page_content for chunk in chunks])

    # 3. remove any existing content or chunks related to the doc
    if db_document:
        # remove existing content and chunks
        delete_chunks_and_content(session, db_document)

    # 4. store the new content and vectors
    metadata_from_parent = {
        "doc_length": document_details.metadata.get("content_length", 0),
        "doc_tokens": document_details.metadata.get("token_count", 0),
    }
    doc_chunks = [
        DocumentChunk(
            chunk_index=i,
            chunk_text=chunk.page_content,
            embedding=embedded_vectors[i],
            meta={
                # add in desired metadata from the parent doc
                **metadata_from_parent,
                # add in metadata from the chunk and group the headers so they aren't spread around
                **(group_headers(chunk.metadata) if hasattr(chunk, 'metadata') and chunk.metadata else {}),
            }
        )
        for i, chunk in enumerate(chunks)]

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

    # add the doc
    session.add(db_document)

    # now that we've flushed the changes and have a docId we can continue
    db_document.chunks = doc_chunks
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
