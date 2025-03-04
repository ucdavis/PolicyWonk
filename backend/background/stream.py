from background.ingest import IngestResult, StreamingIngestProcessor
from background.logger import setup_logger
from background.sources.docapi import ApiDocumentStream
from background.sources.shared import DocumentStream
from background.sources.sitemap import SitemapDocumentStream
from background.sources.servicenow import ServiceNowDocumentStream
from db.constants import SourceType
from db.models import Source

logger = setup_logger()


class DocumentIngestStream():
    @staticmethod
    def getSourceStream(source: Source) -> DocumentStream:
        if source.type == SourceType.UCOP:
            return UcopDocumentStream(source)
        # TODO: Add other source types here
        else:
            raise ValueError(f"Unsupported source type {source.type}")
