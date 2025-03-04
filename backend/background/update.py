"""
Main module to update data for RAG
"""
import asyncio
from datetime import datetime, timedelta, timezone
import gc
import traceback
from dotenv import load_dotenv
import time
from sqlalchemy.orm import Session

from background.logger import setup_logger
from background.stream import DocumentIngestStream, DocumentProcessor
from db.mutations import create_index_attempt
from db.models import IndexAttempt, Source
from db.constants import IndexStatus, RefreshFrequency, SourceStatus
from db.connection import get_session
from db.queries import get_sources

logger = setup_logger()

load_dotenv()  # This loads the environment variables from .env

# TODO: load from env
MAX_SOURCE_FAILURES = 3


async def index_documents(session: Session, source: Source) -> None:
    start_time = datetime.now(timezone.utc)

    logger.info(f"Indexing source {source.name}")

    # create new index attempt
    attempt = create_index_attempt(session, source, start_time)

    # each source needs to implement a DocumentStream class that returns an async iterator of DocumentDetail objects
    # we'll use that along with our IngestProcessor to handle the actual ingestion
    # our ingest and processor are async, so we can handle sources which don't get their data all at once (like APIs or crawling)
    # our ingest will check if the document already exists in the db, if so, update the metadata and text, if not, create a new one.
    # use hash and last_modified to check if file has changed
    # then when all are done, update the source last_updated field and update the attempt with the final counts
    # OPTIONAL: eventually, we could add a check to see if the doc has been removed from the source, and if so, remove it from the db

    try:
        # our docs will be streamed in, since we might not get the list all at once
        stream = DocumentIngestStream.getSourceStream(source)
        processor = DocumentProcessor(stream)

        # Process documents as they arrive
        processor_result = await processor.process_stream()

        logger.info(f"Indexing source {source.name} successful.")

        # End timing the indexing attempt
        end_time = datetime.now(timezone.utc)

        # Record a successful index attempt
        attempt.status = IndexStatus.SUCCESS
        attempt.end_time = end_time
        attempt.duration = (end_time - start_time).total_seconds()
        attempt.num_docs_indexed = processor_result.num_docs_indexed
        attempt.num_new_docs = processor_result.num_new_docs
        attempt.num_docs_removed = 0  # TODO: update with actual counts

        source.last_updated = datetime.now(timezone.utc)
        source.failure_count = 0
        source.last_failed = None

        session.commit()

    except Exception as e:
        end_time = datetime.now(timezone.utc)

        # Record a failed index attempt
        attempt.status = IndexStatus.FAILURE
        attempt.error_details = traceback.format_exc()  # Get full traceback
        attempt.end_time = end_time

        logger.warning(f"Indexing failed for source: {source.name} due to {e}")

        # register failed attempts.  If too many failed attempts, disable the source
        source.last_failed = datetime.now(timezone.utc)
        source.failure_count += 1

        if source.failure_count >= MAX_SOURCE_FAILURES:
            logger.error(
                f"Source {source.name} has failed {source.failure_count} times. Disabling."
            )
            source.status = SourceStatus.FAILED

        session.commit()


async def update_loop(delay: int = 60) -> None:
    """Function to update data."""
    while True:
        start = time.time()
        start_time_utc = datetime.fromtimestamp(
            start).strftime("%Y-%m-%d %H:%M:%S")
        logger.info(f"Running update, current UTC time: {start_time_utc}")

        # get all sources that might need to be updated (daily and last updated more than 1 day ago)
        one_day_ago = datetime.now() - timedelta(days=1)

        with get_session() as session:
            # new session for each loop iteration
            sources_to_index = get_sources(session, one_day_ago,
                                           refresh_frequency=RefreshFrequency.DAILY)

            # we don't want to index any sources that have failed recently
            filtered_sources = []
            current_time = datetime.now()

            for source in sources_to_index:
                if (
                    not source.last_failed
                ):  # if the source has never failed, add it to the list
                    filtered_sources.append(source)
                else:  # if the source has failed, check if it has been long enough to try again
                    allowable_failure_time = source.last_failed + timedelta(
                        hours=source.failure_count * 6
                    )
                    if allowable_failure_time <= current_time:
                        filtered_sources.append(source)

            if not filtered_sources:
                logger.info(
                    "No sources to update. Checking for collections to sync")

                # TODO: will need to rewrite collection sync to work with pgvector/pgsql
                # only once all sources are up to date - attempt to sync collections if needed (only one at a time)
                # sync_first_collection_if_needed(session)

                # if we have on inprogress attempts, they are probably stale, so clean them up since there is nothing else to do
                cleanup_old_attempts(session)

                time.sleep(delay)
                continue

            # we have valid sources in need up update, get the first
            source = filtered_sources[0]

            # Perform indexing
            await index_documents(session, source)

        gc.collect()  # clean up memory after each indexing run

        # end of loop, go back and check for more sources to index


def cleanup_old_attempts(session: Session) -> None:
    """Set to failed any index_attempts that are INPROGRESS and started more than 1 day ago"""
    one_day_ago = datetime.now(timezone.utc) - timedelta(days=1)

    session.query(IndexAttempt).filter(
        IndexAttempt.status == IndexStatus.INPROGRESS,
        IndexAttempt.start_time <= one_day_ago,
    ).update(
        {
            IndexAttempt.status: IndexStatus.FAILURE,
            IndexAttempt.error_details: "Indexing attempt took too long or was interrupted",
        }
    )


async def update__main() -> None:
    """Main function to run the update loop."""
    logger.info("Starting Indexing Loop")
    await update_loop()


if __name__ == "__main__":
    asyncio.run(update__main())
