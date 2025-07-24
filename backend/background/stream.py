from datetime import datetime, timezone
import hashlib
import tempfile
from typing import List

from background.logger import log_memory_usage, setup_logger
from background.sources.apm import UcdApmStream
from background.sources.document_stream import DocumentStream
from background.sources.ingestion import ingest_path_to_markdown
from background.sources.shared import download_document, num_tokens
from background.sources.ucd import UcdPolicyManualDocumentStream
from background.sources.ucop import UcopDocumentStream
from background.vectorize import vectorize_document
from db.constants import SourceType
from db.models import Source
from db.queries import get_document_by_url
from models.document_details import DocumentDetails
from sqlalchemy.orm import Session

from models.ingest_result import IngestResult

logger = setup_logger()

PROCESSOR_BATCH_SIZE = 2  # small for testing


class DocumentIngestStream():
    @staticmethod
    def getSourceStream(source: Source) -> DocumentStream:
        if source.type == SourceType.UCOP:
            return UcopDocumentStream(source)
        elif source.type == SourceType.UCDPOLICYMANUAL:
            return UcdPolicyManualDocumentStream(source)
        elif source.type == SourceType.UCDAPM:
            return UcdApmStream(source)
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
            # - get the content from the document url (or direct_download_url if available)
            # - get the doc from the db and check if it has changed
            # - include hash, content_length (of entire non-chunked content) and other metadata
            # - chunk and vectorize the content, store in vector db
            # - store entire document content in a separate db table (for ctx retrieval)
            # - update/save doc in db
            with tempfile.TemporaryDirectory() as temp_dir:
                if not document_details:
                    logger.warning(
                        f"Document {document_details.url} is empty. Skipping")
                    continue

                logger.info(f"Processing document {document_details.url}")
                log_memory_usage(logger)

                # get the raw content from the document url
                download_url = document_details.direct_download_url or document_details.url
                local_file_path, content_type = download_document(
                    download_url, temp_dir)

                if not local_file_path:
                    logger.error(
                        f"Failed to download document at {download_url}. ")
                    continue

                # ingest raw content into nice markdown
                try:
                    document_details.content = await ingest_path_to_markdown(local_file_path)
                except Exception as e:
                    logger.error(
                        f"Failed to ingest document {download_url}: {str(e)}")
                    continue

                num_docs_indexed += 1

                # get the hash to see if the doc has changed
                content_hash = calculate_content_hash(document_details.content)

                # get the doc from the db
                db_document = get_document_by_url(
                    self.session, document_details.url)

                if db_document and db_document.meta and db_document.meta.get("hash") == content_hash:
                    logger.info(
                        f"Document {document_details.url} has not changed. Skipping")
                    continue

                # doc changed, let's vectorize and update
                num_new_docs += 1

                doc_token_count = num_tokens(
                    document_details.content, 'cl100k_base')

                token_count += doc_token_count

                # add metadata to the document
                document_details.metadata['hash'] = content_hash
                document_details.metadata['content_type'] = content_type
                document_details.metadata['content_length'] = len(
                    document_details.content)
                document_details.metadata['token_count'] = doc_token_count

                # chunk + vectorize + store
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
