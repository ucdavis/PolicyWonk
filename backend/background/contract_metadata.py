"""Refresh only catalog metadata on existing contract chunks, never embeddings."""
from db.constants import SourceType

CATALOG_FIELDS = ("bargaining_units", "keywords",
                  "subject_areas", "responsible_office")


def refresh_contract_metadata(session, source, document, details, *, reconcile=False):
    if source.type != SourceType.UCCONTRACTS or document.source_id != source.id:
        return 0
    if not details.metadata.get("bargaining_units"):
        return 0
    metadata = {key: details.metadata[key] for key in CATALOG_FIELDS}
    previous = document.meta or {}
    if not reconcile and all(previous.get(key) == value for key, value in metadata.items()):
        return 0
    if not previous.get("hash"):
        raise ValueError(f"Contract has no content hash: {document.url}")

    from background.util.elastic import ELASTIC_INDEX, es_client
    result = es_client.update_by_query(
        index=ELASTIC_INDEX, conflicts="abort", refresh=False,
        query={"bool": {"filter": [
            {"term": {"metadata.source_id": source.id}},
            {"term": {"metadata.source_type.keyword": "UCCONTRACTS"}},
            {"term": {"metadata.url.keyword": document.url}},
        ]}},
        script={"lang": "painless", "source": """
            if (ctx._source.metadata.hash != params.hash) {
                throw new IllegalArgumentException('Contract content changed during metadata update');
            }
            boolean changed = false;
            for (entry in params.metadata.entrySet()) {
                if (ctx._source.metadata[entry.getKey()] != entry.getValue()) {
                    ctx._source.metadata[entry.getKey()] = entry.getValue();
                    changed = true;
                }
            }
            if (!changed) { ctx.op = 'noop'; }
        """, "params": {"hash": previous["hash"], "metadata": metadata}},
    )
    if result.get("failures") or result.get("version_conflicts") or result.get("timed_out"):
        raise RuntimeError(
            f"Incomplete contract metadata update: {document.url}")
    if not result.get("total"):
        # Do not advertise a DB-only document as migrated/searchable.
        return 0
    document.meta = {**previous, **metadata}
    session.commit()
    return result.get("updated", 0)
