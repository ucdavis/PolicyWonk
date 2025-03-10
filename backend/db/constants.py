"""
Parameters to control indexing and source status
"""
from enum import Enum


class RefreshFrequency(Enum):
    """Enum for the refresh frequency of a source."""
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"


class IndexStatus(Enum):
    """Enum for the status of an index."""
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    INPROGRESS = "INPROGRESS"


class SourceStatus(Enum):
    """Enum for the status of a source."""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    FAILED = "FAILED"
    DEACTIVATE = "DEACTIVATE"


class SourceType(Enum):
    """Enum for the type of a source."""
    UCOP = "UCOP"  # Crawl UCOP policies
    UCDPOLICYMANUAL = "UCDPOLICYMANUAL"  # Crawl UCD Policy Manual (ellucid)
    UCDAPM = "UCDAPM"  # Crawl UCD APM (Academic Affairs APM)
    UCCONTRACTS = "UCCONTRACTS"  # Crawl UC Contracts and Bargaining Agreements
    # (unsupported) Given a base site, index everything under that path
    RECURSIVE = "RECURSIVE"
    # (unsupported) Given a sitemap.xml URL, parse all the pages in it
    SITEMAP = "SITEMAP"


class RoleName(Enum):
    """Enum for the role of a user."""
    ADMIN = "ADMIN"
    USER = "USER"
