"""Execute unchanged-content ingestion against persisted DB state."""
import asyncio
from datetime import datetime
import json
import sys
from unittest.mock import Mock, AsyncMock

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from db.constants import IndexStatus, SourceType, SourceStatus, RefreshFrequency
from db.models import Document, DocumentContent, IndexAttempt, Source
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
        session.add(source)
        session.flush()
        content = 'Identical contract text'
        document = Document(title='Contract', url='https://example.org/agreement.pdf', source_id=source.id,
                            meta={'hash': stream.calculate_content_hash(
                                content), 'token_count': 5},
                            content=DocumentContent(content=content))
        session.add(document)
        session.commit()
        details = DocumentDetails(url=document.url, metadata=Unit(
            'K3', 'Skilled Craft', 'UC Davis').metadata())
        update = Mock(return_value={
                      'total': 2, 'updated': 2, 'failures': [], 'version_conflicts': 0})
        monkeypatch.setattr(elastic.es_client, 'update_by_query', update)
        monkeypatch.setattr(stream, 'download_document', Mock(
            return_value=('contract.pdf', 'application/pdf')))
        monkeypatch.setattr(stream, 'ingest_path_to_markdown',
                            AsyncMock(return_value=content))
        vectorize = Mock(side_effect=AssertionError(
            'Must not regenerate embeddings'))
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
    assert refresh_contract_metadata(
        session, source, document, details, reconcile=True) == 2
    update.assert_called_once()


def test_unknown_campus_fails_closed():
    from background.sources.collective_bargaining import Unit, UcnetListingError
    with pytest.raises(UcnetListingError, match='campus'):
        Unit('ZZ', 'New local unit', 'Unknown campus').metadata()


def add_contract(session, source, template, suffix):
    document = Document(
        title=suffix, url=f'https://example.org/{suffix}.pdf', source_id=source.id,
        meta=dict(template.meta), content=DocumentContent(content=template.content.content))
    session.add(document)
    session.commit()
    return document


def test_metadata_failures_allow_later_batches_and_still_fail_source(context, monkeypatch):
    session, source, document, details, index_update, vectorize, stream = context
    from background import update
    from background.sources.document_stream import DocumentStream

    IndexAttempt.__table__.create(session.get_bind())
    previous_refresh = datetime(2026, 9, 1)
    source.last_updated = previous_refresh
    session.commit()
    documents = [document] + \
        [add_contract(session, source, document, str(i)) for i in range(3)]
    items = [DocumentDetails(url=doc.url, metadata=dict(
        details.metadata)) for doc in documents]
    items.append(DocumentDetails(url='https://example.org/new.pdf',
                 metadata=dict(details.metadata)))
    failed_urls = [documents[0].url, documents[2].url]
    original_metadata = dict(document.meta)

    class Contracts(DocumentStream):
        async def __aiter__(self):
            for item in items:
                yield item

    monkeypatch.setattr(update.DocumentIngestStream,
                        'getSourceStream', lambda _: Contracts(source))

    def refresh(**kwargs):
        url = kwargs['query']['bool']['filter'][2]['term']['metadata.url.keyword']
        if url == failed_urls[0]:
            raise RuntimeError('Search update failed')
        if url == failed_urls[1]:
            # A failed SQL write requires rollback before later documents can commit.
            session.add(Source(
                name=None, url='https://example.org/invalid', type=SourceType.UCCONTRACTS))
            session.flush()
        return {'total': 1, 'updated': 1}

    index_update.side_effect = refresh

    def save_new(db_session, db_source, item, previous):
        assert previous is None
        result = Document(title='New', url=item.url, source_id=db_source.id,
                          meta=dict(item.metadata), content=DocumentContent(content=item.content))
        db_session.add(result)
        return result

    vectorize.side_effect = save_new
    asyncio.run(update.index_documents(session, source))
    session.expire_all()
    attempt = session.scalars(select(IndexAttempt)).one()
    assert attempt.status == IndexStatus.FAILURE
    assert all(url in attempt.error_details for url in failed_urls)
    assert source.last_updated == previous_refresh
    assert source.failure_count == 1
    assert source.last_failed is not None
    assert source.status == SourceStatus.ACTIVE
    assert index_update.call_count == 4
    vectorize.assert_called_once()
    assert documents[0].meta == documents[2].meta == original_metadata
    for healthy in (documents[1], documents[3]):
        assert healthy.meta['bargaining_units'] == details.metadata['bargaining_units']
    assert session.scalars(select(Document).where(
        Document.url == items[-1].url)).one()
    assert len(session.scalars(select(Source)).all()) == 1

    # Retrying the source repairs only the failed metadata and records success.
    index_update.side_effect = None
    index_update.return_value = {'total': 1, 'updated': 1}
    index_update.reset_mock()
    asyncio.run(update.index_documents(session, source))
    session.expire_all()
    attempts = session.scalars(
        select(IndexAttempt).order_by(IndexAttempt.id)).all()
    assert [item.status for item in attempts] == [
        IndexStatus.FAILURE, IndexStatus.SUCCESS]
    assert index_update.call_count == 2
    assert source.failure_count == 0
    assert source.last_failed is None
    assert source.last_updated > previous_refresh
    vectorize.assert_called_once()


def test_direct_batch_reports_metadata_failure_after_processing_other_documents(context):
    session, source, document, details, index_update, _, stream = context
    healthy = add_contract(session, source, document, 'healthy')
    index_update.side_effect = [RuntimeError('Search update failed'), {
        'total': 1, 'updated': 1}]
    processor = stream.DocumentProcessor(session, Mock(source=source))
    with pytest.raises(ExceptionGroup, match='Contract metadata refresh failed'):
        asyncio.run(processor.process_batch([
            details, DocumentDetails(url=healthy.url, metadata=dict(details.metadata))]))
    session.expire_all()
    assert index_update.call_count == 2
    assert 'bargaining_units' not in document.meta
    assert healthy.meta['bargaining_units'] == details.metadata['bargaining_units']


@pytest.mark.parametrize('apply', [False, True])
def test_backfill_reports_failures_and_completes_remaining_documents(context, monkeypatch, capsys, apply):
    session, source, document, details, index_update, _, _ = context
    from dev import backfill_contract_catalog as backfill

    healthy = add_contract(session, source, document, 'healthy')
    historical = add_contract(session, source, document, 'historical')
    original_metadata = dict(document.meta)
    engine = session.get_bind()
    monkeypatch.setattr(backfill, 'get_session', lambda: Session(engine))
    monkeypatch.setattr(backfill, '_fetch_listing', lambda: [
        details, DocumentDetails(url=healthy.url, metadata=dict(details.metadata))])
    refresh = Mock(return_value={
        '_shards': {'total': 2, 'successful': 2, 'failed': 0}})
    monkeypatch.setattr(backfill.es_client.indices, 'refresh', refresh)
    index_update.side_effect = [RuntimeError('Search update failed'), {
        'total': 1, 'updated': 1}]
    monkeypatch.setattr(sys, 'argv', ['backfill', '--expect-index', backfill.ELASTIC_INDEX] +
                        (['--apply'] if apply else []))
    if apply:
        with pytest.raises(ExceptionGroup, match='Contract catalog backfill failed'):
            backfill.main()
    else:
        backfill.main()
    report = json.loads(capsys.readouterr().out)
    session.expire_all()
    assert report['documents'] == 2
    assert report['historical_untouched'] == 1
    assert report['failed'] == ([document.url] if apply else [])
    assert report['updated_chunks'] == (1 if apply else 0)
    assert document.meta == historical.meta == original_metadata
    assert index_update.call_count == (2 if apply else 0)
    if apply:
        refresh.assert_called_once_with(index=backfill.ELASTIC_INDEX)
        assert healthy.meta['bargaining_units'] == details.metadata['bargaining_units']
    else:
        refresh.assert_not_called()
        assert healthy.meta == original_metadata


@pytest.mark.parametrize('refresh_result', ['exception', 'partial_failure', 'healthy'])
def test_backfill_reports_final_index_refresh_result(context, monkeypatch, capsys, refresh_result):
    session, _, _, details, _, _, _ = context
    from dev import backfill_contract_catalog as backfill

    engine = session.get_bind()
    monkeypatch.setattr(backfill, 'get_session', lambda: Session(engine))
    monkeypatch.setattr(backfill, '_fetch_listing', lambda: [details])
    shard_failures = [{'shard': 0, 'index': backfill.ELASTIC_INDEX,
                       'reason': {'type': 'illegal_state_exception', 'reason': 'Refresh failed'}}]
    refresh = Mock(return_value={'_shards': {
        'total': 2, 'successful': 2, 'failed': 0}})
    if refresh_result == 'exception':
        refresh.side_effect = RuntimeError('Refresh failed')
    elif refresh_result == 'partial_failure':
        refresh.return_value = {'_shards': {
            'total': 2, 'successful': 1, 'failed': 1, 'failures': shard_failures}}
    monkeypatch.setattr(backfill.es_client.indices, 'refresh', refresh)
    monkeypatch.setattr(
        sys, 'argv', ['backfill', '--expect-index', backfill.ELASTIC_INDEX, '--apply'])
    if refresh_result == 'healthy':
        backfill.main()
    else:
        with pytest.raises(ExceptionGroup, match='Contract catalog backfill failed') as failure:
            backfill.main()
    report = json.loads(capsys.readouterr().out)
    assert report['documents'] == 1
    assert report['updated_chunks'] == 2
    assert report['failed'] == []
    refresh.assert_called_once_with(index=backfill.ELASTIC_INDEX)
    if refresh_result == 'healthy':
        assert 'refresh_error' not in report
    else:
        assert len(failure.value.exceptions) == 1
        assert str(failure.value.exceptions[0]) == report['refresh_error']
        if refresh_result == 'exception':
            assert report['refresh_error'] == 'Refresh failed'
        else:
            message, details_json = report['refresh_error'].split(': ', 1)
            assert message == 'Index refresh failed on 1 shards'
            assert json.loads(details_json) == shard_failures
