"""Exercise the installed splitters/store without network or paid embeddings."""
from types import SimpleNamespace
from unittest.mock import Mock

from langchain_core.embeddings import FakeEmbeddings

from background import vectorize
from background.util import elastic
from db.constants import SourceType
from db.models import Source
from models.document_details import DocumentDetails


def fake_client(monkeypatch):
    client = Mock()
    client.options.return_value = client
    client.indices.exists.return_value = SimpleNamespace(
        meta=SimpleNamespace(status=200))
    monkeypatch.setattr(elastic, "es_client", client)
    monkeypatch.setattr(vectorize, "es_client", client)
    embeddings = FakeEmbeddings(size=3)
    monkeypatch.setattr(elastic, "embeddings", embeddings)
    monkeypatch.setattr(vectorize, "embeddings", embeddings)
    return client


def test_vectorize_preserves_text_fields_metadata_and_embedding_dimensions(monkeypatch):
    client = fake_client(monkeypatch)
    # Capture the bulk transport boundary; execute the real LangChain store.
    bulk = Mock(return_value=(1, 0))
    monkeypatch.setattr(
        "elasticsearch.helpers.vectorstore._sync.vectorstore.bulk", bulk)
    delete = Mock()
    monkeypatch.setattr(vectorize, "delete_by_url", delete)
    source = Source(id=7, name="UCOP", type=SourceType.UCOP)
    details = DocumentDetails(url="https://example.org/policy", title="Policy",
                              content="# Eligibility\n\nPolicy text with a qualification.",
                              metadata={"hash": "hash", "keywords": ["policy"], "token_count": 12})
    session = Mock()
    document = vectorize.vectorize_document(session, source, details, None)

    delete.assert_called_once_with(7, details.url)
    actions = bulk.call_args.args[1]
    assert len(actions) == 1
    action = actions[0]
    assert action["_index"] == vectorize.ELASTIC_INDEX
    assert action["text"].split() == details.content.split()
    assert len(action["vector"]) == 3
    assert action["metadata"] == {
        "hash": "hash", "keywords": ["policy"], "token_count": 12,
        "doc_tokens": 12, "doc_length": len(details.content),
        "url": details.url, "title": "Policy", "source_id": 7,
        "source_type": "UCOP", "h1": "Eligibility",
    }
    assert document.content.content == details.content
    session.add.assert_called_once_with(document)
    client.indices.create.assert_not_called()


def test_missing_index_initialization_uses_the_installed_store(monkeypatch):
    client = fake_client(monkeypatch)
    client.indices.exists.return_value = SimpleNamespace(
        meta=SimpleNamespace(status=404))
    assert elastic.ensure_elasticsearch_index() is True
    mappings = client.indices.create.call_args.kwargs["mappings"]
    assert mappings["properties"]["vector"]["dims"] == 3
    assert mappings["properties"]["vector"]["type"] == "dense_vector"
    assert mappings["properties"]["vector"]["similarity"] == "cosine"
