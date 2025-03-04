from typing import List
from background.logger import setup_logger
from background.sources.shared import DocumentStream
from background.sources.ucop import UcopDocumentStream
from db.constants import SourceType
from db.models import Source
from models.document_details import DocumentDetails

logger = setup_logger()


class DocumentIngestStream():
    @staticmethod
    def getSourceStream(source: Source) -> DocumentStream:
        if source.type == SourceType.UCOP:
            return UcopDocumentStream(source)
        # TODO: Add other source types here
        else:
            raise ValueError(f"Unsupported source type {source.type}")


class DocumentProcessor:
    def __init__(self, stream: DocumentStream):
        self.stream = stream
        self.batch_size = 50
        self.current_batch = []

    async def process_stream(self):
        ingest_results = []

        try:
            async for document in self.stream:
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
        # TODO: Implement batch processing

        first = batch[0]

        print(f"Processing batch of {len(batch)} documents")
        print(f"First document: {first}")


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
