"""Backfill metadata on existing contracts. Dry run by default; no PDF downloads.

Run from backend: python -m dev.backfill_contract_catalog --expect-index INDEX
Add --apply after inspecting the dry run. The exact index guard is mandatory.
Historical URLs absent from today's validated listing are retained untouched.
"""
import argparse
import json

from sqlalchemy import select

from background.contract_metadata import refresh_contract_metadata
from background.sources.collective_bargaining import _fetch_listing
from background.util.elastic import ELASTIC_INDEX, es_client
from db.connection import get_session
from db.constants import SourceType
from db.models import Document, Source


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--expect-index', required=True)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if args.expect_index != ELASTIC_INDEX:
        parser.error(
            'Configured Elasticsearch index does not match --expect-index')
    if 'v2' not in ELASTIC_INDEX:
        parser.error('This ingestion backfill supports v2 indexes only')
    # Listing validation completes before the first write.
    listing = {details.url: details for details in _fetch_listing()}
    report = {'index': ELASTIC_INDEX, 'apply': args.apply, 'documents': 0,
              'updated_chunks': 0, 'historical_untouched': 0, 'missing_from_db': 0}
    with get_session() as session:
        sources = session.scalars(select(Source).where(
            Source.type == SourceType.UCCONTRACTS)).all()
        if len(sources) != 1:
            raise ValueError('Expected exactly one UCCONTRACTS source')
        source = sources[0]
        documents = session.scalars(select(Document).where(
            Document.source_id == source.id)).all()
        report['missing_from_db'] = len(
            set(listing) - {doc.url for doc in documents})
        for document in documents:
            details = listing.get(document.url)
            if details is None:
                report['historical_untouched'] += 1
                continue
            report['documents'] += 1
            if args.apply:
                report['updated_chunks'] += refresh_contract_metadata(
                    session, source, document, details, reconcile=True)
        if args.apply:
            es_client.indices.refresh(index=ELASTIC_INDEX)
    print(json.dumps(report, sort_keys=True))


if __name__ == '__main__':
    main()
