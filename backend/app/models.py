import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database import Base

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False)
    password_hash = Column(String(255), nullable=False)
    plan = Column(String(32), default="free")
    role = Column(String(32), default="user", index=True)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    daily_quota = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    files = relationship("StoredFile", back_populates="owner")
    jobs = relationship("Job", back_populates="owner")
    subscriptions = relationship("Subscription", back_populates="user")


class StoredFile(Base):
    __tablename__ = "files"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    original_name = Column(String(512), nullable=False)
    stored_path = Column(String(1024), nullable=False)
    mime = Column(String(128), default="application/pdf")
    size_bytes = Column(Integer, default=0)
    page_count = Column(Integer, default=0)
    kind = Column(String(32), default="upload")
    created_at = Column(DateTime(timezone=True), default=utcnow)

    owner = relationship("User", back_populates="files")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    tool = Column(String(64), nullable=False, index=True)
    status = Column(String(32), default="queued", index=True)
    progress = Column(Integer, default=0)
    message = Column(Text, default="")
    options = Column(JSON_TYPE, default=dict)
    input_file_ids = Column(JSON_TYPE, default=list)
    output_file_id = Column(Uuid(as_uuid=True), ForeignKey("files.id"), nullable=True)
    extra_outputs = Column(JSON_TYPE, default=list)
    error = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=utcnow)
    finished_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="jobs")
    output_file = relationship("StoredFile", foreign_keys=[output_file_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(64), nullable=False)
    detail = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    plan = Column(String(32), default="free")
    status = Column(String(32), default="active")
    daily_quota = Column(Integer, default=40)
    starts_at = Column(DateTime(timezone=True), default=utcnow)
    ends_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="subscriptions")


class Guide(Base):
    __tablename__ = "guides"

    id = Column(String(64), primary_key=True)
    title = Column(String(200), nullable=False)
    summary = Column(Text, default="")
    tool_slug = Column(String(64), default="")
    steps = Column(JSON_TYPE, default=list)
    related = Column(JSON_TYPE, default=list)
