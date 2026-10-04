from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    plan: str
    role: str = "user"
    is_admin: bool
    is_active: bool = True
    daily_quota: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

    @field_validator("role", mode="before")
    @classmethod
    def default_role(cls, value):
        return value or "user"

    @field_validator("is_active", mode="before")
    @classmethod
    def default_active(cls, value):
        return True if value is None else value


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class FileOut(BaseModel):
    id: UUID
    original_name: str
    mime: str
    size_bytes: int
    page_count: int
    kind: str
    created_at: datetime

    class Config:
        from_attributes = True


class JobCreate(BaseModel):
    tool: str
    file_ids: list[UUID] = []
    options: dict[str, Any] = {}


class JobOut(BaseModel):
    id: UUID
    tool: str
    status: str
    progress: int
    message: str
    options: dict[str, Any] = {}
    input_file_ids: list[Any] = []
    output_file_id: Optional[UUID] = None
    extra_outputs: list[Any] = []
    error: str = ""
    created_at: datetime
    finished_at: Optional[datetime] = None
    output_file: Optional[FileOut] = None

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6)


class UsageOut(BaseModel):
    jobs_today: int
    quota: int
    plan: str
    storage_bytes: int


class AdminUserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=6, max_length=128)
    plan: str = "free"
    role: str = "user"
    daily_quota: Optional[int] = None
    is_active: bool = True
    notes: str = ""


class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)
    plan: Optional[str] = None
    role: Optional[str] = None
    daily_quota: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    subscription_status: Optional[str] = None
    subscription_ends_at: Optional[datetime] = None


class SubscriptionOut(BaseModel):
    id: UUID
    user_id: UUID
    plan: str
    status: str
    daily_quota: int
    starts_at: datetime
    ends_at: Optional[datetime] = None
    notes: str = ""
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminUserOut(UserOut):
    jobs_count: int = 0
    files_count: int = 0
    subscription: Optional[SubscriptionOut] = None
