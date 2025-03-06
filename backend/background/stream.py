from datetime import datetime, timezone
import hashlib
from typing import List

from langchain_openai import OpenAIEmbeddings
from langchain_core.embeddings import FakeEmbeddings
from background.logger import setup_logger
from background.sources.shared import DocumentStream
from background.sources.ucop import UcopDocumentStream
from background.vectorize import vectorize_document
from db.constants import SourceType
from db.models import Document, DocumentChunk, DocumentContent, Source
from db.mutations import delete_chunks_and_content
from db.queries import get_document_by_url
from models.document_details import DocumentDetails
from sqlalchemy.orm import Session
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

from models.ingest_result import IngestResult

logger = setup_logger()

PROCESSOR_BATCH_SIZE = 2  # small for testing


class DocumentIngestStream():
    @staticmethod
    def getSourceStream(source: Source) -> DocumentStream:
        if source.type == SourceType.UCOP:
            return UcopDocumentStream(source)
        # TODO: Add other source types here
        else:
            raise ValueError(f"Unsupported source type {source.type}")


class DocumentProcessor:
    def __init__(self, session: Session, stream: DocumentStream):
        self.session = session
        self.stream = stream
        self.batch_size = PROCESSOR_BATCH_SIZE
        self.current_batch = []

    async def process_stream(self):
        ingest_results = []

        try:
            async for document in self.stream:
                logger.info(
                    f"New document: {document} added to batch.  Current batch size: {len(self.current_batch)}")
                self.current_batch.append(document)

                if len(self.current_batch) >= self.batch_size:
                    ingest_result = await self.process_batch(self.current_batch)

                    ingest_results.append(ingest_result)
                    self.current_batch = []

            # Process any remaining documents
            if self.current_batch:
                ingest_result = await self.process_batch(self.current_batch)
                ingest_results.append(ingest_result)

            return IngestResult.combine_results(ingest_results)
        except Exception as e:
            logger.error(f"Error processing stream: {str(e)}")
            raise

    async def process_batch(self, batch: List[DocumentDetails]):
        start_time = datetime.now(timezone.utc)
        num_docs_indexed = 0
        num_new_docs = 0
        token_count = 0

        for document_details in batch:
            # - get the doc from the db and check if it has changed
            # - include hash, content_length (of entire non-chunked content) and other metadata
            # - chunk and vectorize the content, store in vector db
            # - store entire document content in a separate db table (for ctx retrieval)
            # - update/save doc in db
            logger.info(f"Processing document {document_details.url}")

            if not document_details:
                logger.warning(
                    f"Document {document_details.url} is empty. Skipping")
                continue

            num_docs_indexed += 1

            content_hash = calculate_content_hash(document_details.content)

            # add the content hash so we have it for later
            document_details.metadata['hash'] = content_hash

            # get the doc from the db
            db_document = get_document_by_url(
                self.session, document_details.url)

            if db_document and db_document.meta and db_document.meta.get("hash") == content_hash:
                logger.info(
                    f"Document {document_details.url} has not changed. Skipping")
                continue

            # doc changed, let's vectorize and update
            num_new_docs += 1
            db_document = vectorize_document(self.session, self.stream.source,
                                             document_details, db_document)

            # TODO: do we want to commit here? or just keep flushing? Seems to me we might want to comit after each doc?
            self.session.commit()

        # end of batch
        logger.info(
            f"Indexed {num_docs_indexed} documents from source {self.stream.source.name} with {token_count} tokens")

        end_time = datetime.now(timezone.utc)

        return IngestResult(
            num_docs_indexed=num_docs_indexed,
            num_new_docs=num_new_docs,
            source_id=self.stream.source.id,
            start_time=start_time,
            end_time=end_time,
            duration=(end_time - start_time).total_seconds()
        )


def calculate_content_hash(content: str) -> str:
    hasher = hashlib.sha256()
    hasher.update(content.encode())
    return hasher.hexdigest()
