from datetime import datetime

from sqlalchemy import delete
from sqlalchemy.orm import Session

from db.constants import IndexStatus
from db.models import Document, DocumentChunk, DocumentContent, IndexAttempt, Source


def create_index_attempt(session: Session, source: Source, start_time: datetime) -> IndexAttempt:
    # create new index attempt
    attempt = IndexAttempt(
        source_id=source.id,
        status=IndexStatus.INPROGRESS,
        num_docs_indexed=0,
        num_new_docs=0,
        num_docs_removed=0,
        start_time=start_time,
        duration=0,
        end_time=None,
        error_details=None,
    )

    session.add(attempt)
    session.commit()

    return attempt


def delete_chunks_and_content(session: Session, document: Document) -> None:
    # delete all chunks and content for the document
    session.execute(delete(DocumentChunk).where(
        DocumentChunk.document_id == document.id))

    session.execute(delete(DocumentContent).where(
        DocumentContent.document_id == document.id))
