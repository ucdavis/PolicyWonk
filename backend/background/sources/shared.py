from typing import AsyncIterator
from db.models import Source
from models.document_details import DocumentDetails


class DocumentStream:
    """Base class for streaming documents from various sources.

    Provides an async iterator interface for retrieving DocumentDetails
    from a specific source.
    """

    def __init__(self, source: Source):
        if not source:
            raise ValueError("source must be provided")
        self.source = source

    async def __aiter__(self) -> AsyncIterator[DocumentDetails]:
        """
        Asynchronous iterator method to be overridden in subclasses.

        Returns:
            AsyncIterator[DocumentDetails]: An asynchronous iterator of `DocumentDetails`.
        """
        raise NotImplementedError
