from datetime import datetime, timezone
import hashlib
from typing import List

from langchain_openai import OpenAIEmbeddings
from langchain_core.embeddings import FakeEmbeddings
from background.logger import setup_logger
from background.sources.shared import DocumentStream
from background.sources.ucop import UcopDocumentStream
from db.constants import SourceType
from db.models import Document, DocumentChunk, DocumentContent, Source
from db.mutations import delete_chunks_and_content
from db.queries import get_document_by_url
from models.document_details import DocumentDetails
from sqlalchemy.orm import Session
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

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
        # TODO: refactor into separate class/file

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
            db_document = self.vectorize_document(
                document_details, db_document)

            self.session.flush()  # TODO: do we want to commit here? or just keep flushing? Seems to me we might want to comit after each doc?

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

    def vectorize_document(self, document_details: DocumentDetails, db_document: Document | None):
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
        chunk_size = 500
        chunk_overlap = 30
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )

        chunks = text_splitter.split_documents(md_header_splits)

        # log the chunks
        logger.info(
            f"Document {document_details.url} has {len(chunks)} chunks")

        # 2. vectorize the chunks
        # OpenAIEmbeddings(model='text-embedding-3-small')
        embeddings = FakeEmbeddings(size=1536)

        # mass embeddings for all chunks
        embedded_vectors = embeddings.embed_documents(
            [chunk.page_content for chunk in chunks])

        # 3. remove any existing content or chunks related to the doc
        if db_document:
            # remove existing content and chunks
            delete_chunks_and_content(self.session, db_document)

        # 4. store the new content and vectors
        doc_chunks = [
            DocumentChunk(
                chunk_index=i,
                chunk_text=chunk.page_content,
                embedding=embedded_vectors[i],
                meta=chunk.metadata if hasattr(chunk, 'metadata') else None
            )
            for i, chunk in enumerate(chunks)]

        doc_content = DocumentContent(content=document_details.content)

        # get the metadata for this doc
        metadata = document_details.metadata or {}

        # 5. update the db document info
        if not db_document:
            db_document = Document(
                url=document_details.url,
                title=document_details.title,
                meta=metadata,
                source_id=self.stream.source.id,
                last_updated=datetime.now(timezone.utc)
            )
        else:
            # already exists
            db_document.title = document_details.title
            db_document.source_id = self.stream.source.id
            db_document.last_updated = datetime.now(timezone.utc)
            db_document.url = document_details.url
            db_document.meta = metadata

        # save the doc
        self.session.add(db_document)
        self.session.flush()

        # now that we've flushed the changes and have a docId we can continue
        db_document.chunks = doc_chunks
        db_document.content = doc_content

        return db_document


class IngestResult:

    def __init__(
        self,
        num_docs_indexed,
        num_new_docs,
        source_id,
        start_time,
        end_time,
        duration,
    ):
        self.num_docs_indexed = num_docs_indexed
        self.num_new_docs = num_new_docs
        self.source_id = source_id
        self.start_time = start_time
        self.end_time = end_time
        self.duration = duration

    @staticmethod
    def combine_results(results: List['IngestResult']) -> 'IngestResult':
        """
        Combines multiple ingest results into a single result by summing their values.
        SourceId must be the same across all results.
        Time values reflect the total span across all results.

        Args:
            results (List[IngestResult]): List of IngestResult objects to combine

        Returns:
            IngestResult: Combined result with summed values
        """
        if not results:
            return get_bad_ingest_result()

        # make sure all source ids are the same
        if len(set(r.source_id for r in results)) > 1:
            raise ValueError(
                "All source ids must be the same to combine results")

        total_docs_indexed = sum(r.num_docs_indexed for r in results)
        total_new_docs = sum(r.num_new_docs for r in results)
        total_duration = sum(r.duration for r in results)
        start_time = min(r.start_time for r in results)
        end_time = max(r.end_time for r in results)

        # Keep the source_id from the first result as specified
        source_id = results[0].source_id

        return IngestResult(
            num_docs_indexed=total_docs_indexed,
            num_new_docs=total_new_docs,
            source_id=source_id,
            start_time=start_time,
            end_time=end_time,
            duration=total_duration
        )


def get_bad_ingest_result() -> IngestResult:
    return IngestResult(
        num_docs_indexed=0,
        num_new_docs=0,
        source_id=None,
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc),
        duration=0,
    )


def calculate_content_hash(content: str) -> str:
    hasher = hashlib.sha256()
    hasher.update(content.encode())
    return hasher.hexdigest()


# if __name__ == "__main__":
#     # load sample policy from file
#     with open("/workspace/backend/experiments/data/sample_policy.md", "r") as f:
#         content = f.read()

#     fake_document_details = DocumentDetails(
#         content=content)

#     vectorize_document(fake_document_details, None)
