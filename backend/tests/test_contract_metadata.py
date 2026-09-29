"""Execute unchanged-content ingestion against persisted DB state."""
import asyncio
from unittest.mock import Mock, AsyncMock

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from db.constants import SourceType, SourceStatus, RefreshFrequency
from db.models import Document, DocumentContent, Source
from models.document_details import DocumentDetails


@pytest.fixture
def context(monkeypatch):
    monkeypatch.setenv('USE_DEV_SETTINGS', 'true')
    monkeypatch.setenv('ELASTIC_URL', 'http://127.0.0.1:9200')
    from background import stream
    from background.util import elastic
    from background.sources.collective_bargaining import Unit
    engine = create_engine('sqlite:///:memory:')
    for model in (Source, Document, DocumentContent):
        model.__table__.create(engine)
    with Session(engine) as session:
        source = Source(name='Contracts', type=SourceType.UCCONTRACTS, url='https://example.org',
                        status=SourceStatus.ACTIVE, refresh_frequency=RefreshFrequency.DAILY)
        session.add(source); session.flush()
        content = 'Identical contract text'
        document = Document(title='Contract', url='https://example.org/agreement.pdf', source_id=source.id,
                            meta={'hash': stream.calculate_content_hash(content), 'token_count': 5},
                            content=DocumentContent(content=content))
        session.add(document); session.commit()
        details = DocumentDetails(url=document.url, metadata=Unit('K3', 'Skilled Craft', 'UC Davis').metadata())
        update = Mock(return_value={'total': 2, 'updated': 2, 'failures': [], 'version_conflicts': 0})
        monkeypatch.setattr(elastic.es_client, 'update_by_query', update)
        monkeypatch.setattr(stream, 'download_document', Mock(return_value=('contract.pdf', 'application/pdf')))
        monkeypatch.setattr(stream, 'ingest_path_to_markdown', AsyncMock(return_value=content))
        vectorize = Mock(side_effect=AssertionError('Must not regenerate embeddings'))
        monkeypatch.setattr(stream, 'vectorize_document', vectorize)
        yield session, source, document, details, update, vectorize, stream
    engine.dispose()


def test_unchanged_content_backfills_metadata_and_preserves_content_hash(context):
    session, source, document, details, update, vectorize, stream = context
    original = dict(document.meta)
    processor = stream.DocumentProcessor(session, Mock(source=source))
    result = asyncio.run(processor.process_batch([details]))
    session.expire_all()
    assert document.meta == {**original, **details.metadata}
    assert document.content.content == 'Identical contract text'
    assert result.num_new_docs == 0
    assert update.call_args.kwargs['script']['params']['hash'] == original['hash']
    assert update.call_args.kwargs['query']['bool']['filter'] == [
        {'term': {'metadata.source_id': source.id}},
        {'term': {'metadata.source_type.keyword': 'UCCONTRACTS'}},
        {'term': {'metadata.url.keyword': document.url}},
    ]
    vectorize.assert_not_called()
    # Successful metadata migration is idempotent for future normal refreshes.
    asyncio.run(processor.process_batch([details]))
    update.assert_called_once()


@pytest.mark.parametrize('failure', [{'failures': ['partial failure']}, {'version_conflicts': 1}, {'timed_out': True}])
def test_partial_index_failure_does_not_mark_db_as_migrated_and_can_retry(context, failure):
    session, source, document, details, update, _, _ = context
    from background.contract_metadata import refresh_contract_metadata
    previous = dict(document.meta)
    update.return_value = {'total': 2, 'updated': 1, **failure}
    with pytest.raises(RuntimeError):
        refresh_contract_metadata(session, source, document, details)
    session.expire_all()
    assert document.meta == previous
    update.return_value = {'total': 2, 'updated': 1, 'noops': 1}
    assert refresh_contract_metadata(session, source, document, details) == 1
    assert document.meta['bargaining_units'] == details.metadata['bargaining_units']


def test_db_only_and_noncontract_documents_are_not_backfilled(context):
    session, source, document, details, update, _, _ = context
    from background.contract_metadata import refresh_contract_metadata
    update.return_value = {'total': 0}
    assert refresh_contract_metadata(session, source, document, details) == 0
    assert 'bargaining_units' not in document.meta
    source.type = SourceType.UCOP
    refresh_contract_metadata(session, source, document, details)
    update.assert_called_once()


def test_explicit_backfill_reconciles_chunks_even_if_db_was_already_migrated(context):
    session, source, document, details, update, _, _ = context
    from background.contract_metadata import refresh_contract_metadata
    document.meta = {**document.meta, **details.metadata}
    assert refresh_contract_metadata(session, source, document, details, reconcile=True) == 2
    update.assert_called_once()


def test_unknown_campus_fails_closed():
    from background.sources.collective_bargaining import Unit, UcnetListingError
    with pytest.raises(UcnetListingError, match='campus'):
        Unit('ZZ', 'New local unit', 'Unknown campus').metadata()
