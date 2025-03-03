"""
Data models for sources, indices, and documents
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import JSON, Boolean, Column, DateTime, Enum, Float, ForeignKey, Index, Integer, Table, func
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy import String

from db.constants import IndexStatus, RefreshFrequency, RoleName, SourceStatus, SourceType


class Base(DeclarativeBase):
    pass


class Chat(Base):
    # Chat is a single chat instance, which can contain multiple messages
    __tablename__ = "chats"

    # id is provided by the chat platform (nextJS)
    id: Mapped[str] = mapped_column(String, primary_key=True)

    title: Mapped[str] = mapped_column(String, nullable=False)

    # full list of messages
    messages: Mapped[dict] = mapped_column(JSON, nullable=False)

    # which chat assistant is being used
    assistant_slug: Mapped[str] = mapped_column(
        ForeignKey("assistants.slug"), nullable=False)

    # llm model being used
    llm_model: Mapped[str] = mapped_column(String, nullable=False)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False)
    user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="chats")

    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False)

    share_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    assistant = relationship("Assistant", back_populates="chats")

    # Define indexes
    __table_args__ = (
        Index('idx_userid_active_timestamp', 'user_id', 'active', 'timestamp'),
        Index('idx_id_active', 'id', 'active')
    )


class Assistant(Base):
    __tablename__ = "assistants"

    # Primary key (auto-incremented ID)
    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)

    # Slug used in the URL (unique)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    # Assistant name and description
    name: Mapped[str] = mapped_column(String, nullable=False)

    description: Mapped[str] = mapped_column(String, nullable=False)

    # Theme as a choice between gunrock and sage (Enum in SQLAlchemy)
    theme: Mapped[str] = mapped_column(String, nullable=False)

    # Relationship with chats (one-to-many)
    chats = relationship("Chat", back_populates="assistant")

    instructions: Mapped[str] = mapped_column(String, nullable=True)

    # Relationship with default questions (one-to-many)
    default_questions = relationship(
        "DefaultQuestion", back_populates="assistant")

    collections: Mapped[List["Collection"]] = relationship(
        "Collection",
        secondary="assistant_collections",
        back_populates="assistants"
    )


class AssistantCollection(Base):
    """
    Join table for assistants and collections
    """
    __tablename__ = "assistant_collections"

    assistant_id: Mapped[int] = mapped_column(
        ForeignKey("assistants.id"), primary_key=True)
    collection_id: Mapped[int] = mapped_column(
        ForeignKey("collections.id"), primary_key=True)

    __table_args__ = (
        Index('ix_assistant_collections_assistant_id', 'assistant_id'),
        Index('ix_assistant_collections_collection_id', 'collection_id'),
    )


class DefaultQuestion(Base):
    __tablename__ = "default_questions"

    # Primary key (auto-incremented ID)
    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)

    # Foreign key to link to the assistant's slug
    assistant_slug: Mapped[str] = mapped_column(
        ForeignKey("assistants.slug"), nullable=False)

    # Default question text
    question: Mapped[str] = mapped_column(String, nullable=False)

    # Relationship back to the Assistant model
    assistant = relationship(
        "Assistant", back_populates="default_questions")


class Source(Base):
    # Source is a source of documents, usually a website
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    # Web URL of the source for websites
    url: Mapped[str] = mapped_column(String, nullable=False)

    refresh_frequency: Mapped[RefreshFrequency] = mapped_column(
        Enum(RefreshFrequency, native_enum=False), nullable=False
    )

    status: Mapped[SourceStatus] = mapped_column(
        Enum(SourceStatus, native_enum=False), nullable=False)

    type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, native_enum=False), nullable=False)

    # allow dict of custom config values
    # TODO: use pydantic model: https://gist.github.com/srkirkland/953551872c5cb5838bde035413a8da32
    config: Mapped[dict] = mapped_column(JSON, nullable=True)

    last_updated: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )

    last_failed: Mapped[Optional[datetime]
                        ] = mapped_column(DateTime, nullable=True)

    failure_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False)

    index_attempts: Mapped[list['IndexAttempt']] = relationship(
        "IndexAttempt", back_populates="source")

    documents: Mapped[list['Document']] = relationship(
        "Document", back_populates="source")

    collections: Mapped[list['Collection']] = relationship(
        "Collection",
        secondary="collections_sources",
        back_populates="sources")

    __table_args__ = (
        Index('ix_source_refresh_status_last_updated',
              'refresh_frequency',
              'status',
              'last_updated'),
    )


class IndexAttempt(Base):
    __tablename__ = "index_attempts"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)
    status: Mapped[IndexStatus] = mapped_column(
        Enum(IndexStatus, native_enum=False), nullable=False)

    num_docs_indexed: Mapped[int] = mapped_column(Integer, default=0)
    num_new_docs: Mapped[int] = mapped_column(Integer, default=0)
    num_docs_removed: Mapped[int] = mapped_column(Integer, default=0)

    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True)

    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_details: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Foreign key to sources
    source_id: Mapped[int] = mapped_column(
        ForeignKey("sources.id"), nullable=False)

    # Relationship to source
    source: Mapped["Source"] = relationship(
        "Source", back_populates="index_attempts")


class Document(Base):
    __tablename__ = "documents"

    # id is URL path of the doc
    id: Mapped[str] = mapped_column(String, primary_key=True)

    # title is the title of the document
    title: Mapped[str] = mapped_column(String, nullable=False)

    # full URL
    url: Mapped[Optional[str]] = mapped_column(
        String, nullable=True, index=True)

    meta: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    source_id: Mapped[int] = mapped_column(
        ForeignKey("sources.id"), nullable=False)
    source: Mapped["Source"] = relationship(
        "Source", back_populates="documents")

    last_updated: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )


user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("role_id", ForeignKey("roles.id"), primary_key=True),
)


class User(Base):
    # store users that will have roles in the system
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    kerberos: Mapped[str] = mapped_column(String(20), nullable=True)
    # TODO: make iam unique/notnull once we have all the data
    iam: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    ms_user_id: Mapped[str] = mapped_column(
        String, nullable=False, unique=True)
    titles: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    affiliations: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    departments: Mapped[Optional[str]
                        ] = mapped_column(String, nullable=True)

    roles: Mapped[List["Role"]] = relationship(
        secondary=user_roles, back_populates="users")
    chats: Mapped[List["Chat"]] = relationship("Chat", back_populates="user")

    __table_args__ = (
        Index('ix_users_name', 'name'),
        Index('ix_users_email', 'email'),
        Index('ix_users_kerberos', 'kerberos'),
    )


class Role(Base):
    # Role is a model for roles
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)

    name: Mapped[RoleName] = mapped_column(
        Enum(RoleName, native_enum=False), nullable=False)

    users: Mapped[List["User"]] = relationship(
        secondary=user_roles, back_populates="roles")


class Prompt(Base):
    __tablename__ = "prompts"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)
    prompt: Mapped[str] = mapped_column(String, nullable=False)
    expected_output: Mapped[Optional[str]
                            ] = mapped_column(String, nullable=True)
    category: Mapped[str] = mapped_column(String, nullable=False)
    comments: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    prompt_evaluations: Mapped[List["PromptEvaluation"]] = relationship(
        "PromptEvaluation", back_populates="prompt")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)
    assistant_id: Mapped[int] = mapped_column(
        ForeignKey("assistants.id"), nullable=False)
    pipeline_version: Mapped[str] = mapped_column(String, nullable=False)
    comments: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    run_date: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)

    prompt_evaluations: Mapped[List["PromptEvaluation"]] = relationship(
        "PromptEvaluation", back_populates="evaluation")


class PromptEvaluation(Base):
    __tablename__ = "prompt_evaluations"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)
    prompt_id: Mapped[int] = mapped_column(
        ForeignKey("prompts.id"), nullable=False)
    evaluation_id: Mapped[int] = mapped_column(
        ForeignKey("evaluations.id"), nullable=False)
    actual_output: Mapped[str] = mapped_column(String, nullable=False)
    context: Mapped[str] = mapped_column(String, nullable=True)
    scores: Mapped[dict] = mapped_column(JSON, nullable=True)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)

    prompt: Mapped["Prompt"] = relationship(
        "Prompt", back_populates="prompt_evaluations")
    evaluation: Mapped["Evaluation"] = relationship(
        "Evaluation", back_populates="prompt_evaluations")


class Collection(Base):
    """
    Represents a collection of sources.  Used by the assistant to determine which sources to use.
    """
    __tablename__ = "collections"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    created_date: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # true if we need to sync the collection mapping with the index
    requires_sync: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True)

    sources: Mapped[List["Source"]] = relationship(
        "Source",
        secondary="collections_sources",
        back_populates="collections"
    )

    assistants: Mapped[List["Assistant"]] = relationship(
        "Assistant",
        secondary="assistant_collections",
        back_populates="collections"
    )


class CollectionSource(Base):
    """
    Join table for collections and sources
    """
    __tablename__ = "collections_sources"

    collection_id: Mapped[int] = mapped_column(
        ForeignKey("collections.id"), primary_key=True)
    source_id: Mapped[int] = mapped_column(
        ForeignKey("sources.id"), primary_key=True)

    __table_args__ = (
        Index('ix_collections_sources_collection_id', 'collection_id'),
        Index('ix_collections_sources_source_id', 'source_id'),
    )
