from datetime import datetime

from sqlalchemy.orm import Session

from db.constants import IndexStatus
from db.models import IndexAttempt, Source


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
