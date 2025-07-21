import json
import re
from typing import Any, Dict, List, Optional


class DocumentDetails:
    """
    Represents the details of a document. Will be used as common metadata for all docs
    """

    def __init__(
        self,
        title="",
        url="",
        description="",
        content="",
        last_modified="",
        direct_download_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.title = title
        self.filename = sanitize_filename(title)
        self.url = url
        # some documents may not have a direct download URL, in which case it will be None
        self.direct_download_url = direct_download_url
        # description is a short summary of the document
        self.description = description
        # content is the full text of the document. do not include in metadata
        self.content = content
        self.last_modified = last_modified
        self.metadata = metadata or {}

    def to_vectorized_document(self, text: str):
        return VectorDocument(
            text,
            {
                "title": self.title,
                "filename": self.filename,
                "url": self.url,
                "description": self.description,
                "last_modified": self.last_modified
            }
        )

    def __str__(self):
        return f"{self.title} - {self.url} - {self.description} - {self.last_modified}"


def sanitize_filename(filename):
    """Sanitize the filename by removing or replacing invalid characters."""
    return re.sub(r'[\\/*?:"<>|]', "", filename)


class VectorDocument:
    def __init__(self, text: str, metadata: dict):
        self.text: str = text
        self.metadata: dict = metadata

    def __str__(self):
        metadata_str = json.dumps(self.metadata, indent=4)
        return f"Text: {self.text}\nMetadata: {metadata_str}"

    def update_metadata(self, new_metadata: Dict[str, Any]):
        """
        Instance method to update the metadata dictionary of this VectorDocument.

        :param new_metadata: Dictionary containing metadata entries to update or add
        """
        self.metadata.update(new_metadata)
