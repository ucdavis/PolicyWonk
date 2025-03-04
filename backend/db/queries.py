from datetime import datetime
from sqlalchemy.orm import Session

from db.models import Source
from db.constants import RefreshFrequency, SourceStatus

from sqlalchemy import or_


def get_sources(session: Session, last_updated: datetime, refresh_frequency: RefreshFrequency = RefreshFrequency.DAILY, status: SourceStatus = SourceStatus.ACTIVE) -> list['Source']:
    return session.query(Source).filter(
        or_(Source.last_updated < last_updated, Source.last_updated.is_(None)),
        Source.refresh_frequency == refresh_frequency,
        Source.status == status
    ).all()
