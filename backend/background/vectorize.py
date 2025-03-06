from datetime import datetime, timezone

from langchain_core.embeddings import FakeEmbeddings
from background.logger import setup_logger
from db.models import Document, DocumentChunk, DocumentContent, Source
from db.mutations import delete_chunks_and_content
from models.document_details import DocumentDetails
from sqlalchemy.orm import Session
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

logger = setup_logger()


def vectorize_document(session: Session, source: Source, document_details: DocumentDetails, db_document: Document | None):
    # we want to re-vectorize the document if it has changed, or otherwise create new
    # 1. chunk the content
    # 2. vectorize the chunks
    # 3. remove any existing content or chunks related to the doc
    # 4. store the new content and vectors
    # 5. return the updated db document

    # 1. We're going to use langchain to chunk using the content (assuming it's markdown)
    # https://python.langchain.com/docs/how_to/markdown_header_metadata_splitter/
    headers_to_split_on = [
        ("#", "h1"),
        ("##", "h2"),
        ("###", "h3"),
    ]

    # first we split the content into headers and content
    markdown_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on, strip_headers=False)
    md_header_splits = markdown_splitter.split_text(
        document_details.content)

    # now we need to chunk the content into smaller pieces so it can be vectorized
    # langchain uses character sizes so token sizes are about 4x the character size
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
    # embeddings = OpenAIEmbeddings(model='text-embedding-3-small')
    embeddings = FakeEmbeddings(size=1536)

    # mass embeddings for all chunks
    embedded_vectors = embeddings.embed_documents(
        [chunk.page_content for chunk in chunks])

    # 3. remove any existing content or chunks related to the doc
    if db_document:
        # remove existing content and chunks
        delete_chunks_and_content(session, db_document)

    # 4. store the new content and vectors
    doc_chunks = [
        DocumentChunk(
            chunk_index=i,
            chunk_text=chunk.page_content,
            embedding=embedded_vectors[i],
            meta={
                # each chunk should have the doc metadata
                **(document_details.metadata if document_details.metadata else {}),
                # add in any metadata from the chunk
                **(chunk.metadata if hasattr(chunk, 'metadata') and chunk.metadata else {}),
                # add the length of the parent doc
                "parent_document_length": len(document_details.content)
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
