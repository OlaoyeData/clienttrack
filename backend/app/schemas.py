import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator, ConfigDict

from app.models import ProjectType, ProjectStatus, TaskStatus


# ---------- Auth ----------

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 10:
            raise ValueError("Password must be at least 10 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain a digit")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full name cannot be blank")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Tasks ----------

class TaskOut(BaseModel):
    id: str
    week_number: int
    order_in_week: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    completed_at: Optional[datetime] = None
    evidence_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class TaskUpdate(BaseModel):
    status: TaskStatus
    evidence_url: Optional[str] = None


class TaskCreate(BaseModel):
    week_number: int
    title: str
    description: Optional[str] = None


# ---------- Projects ----------

class ProjectCreate(BaseModel):
    client_name: str
    client_email: Optional[EmailStr] = None
    title: str
    project_type: ProjectType
    description: str
    num_pages: Optional[int] = None
    duration_weeks: int
    duration_days: int = 0

    @field_validator("duration_weeks")
    @classmethod
    def weeks_positive(cls, v: int) -> int:
        if v < 1 or v > 104:
            raise ValueError("duration_weeks must be between 1 and 104")
        return v

    @field_validator("description")
    @classmethod
    def description_length(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError("Please give a bit more detail (10+ characters)")
        return v.strip()


class ProjectOut(BaseModel):
    id: str
    client_name: str
    client_email: Optional[str] = None
    title: str
    project_type: ProjectType
    description: str
    num_pages: Optional[int] = None
    duration_weeks: int
    duration_days: int
    status: ProjectStatus
    share_token: str
    share_enabled: bool
    created_at: datetime
    tasks: list[TaskOut] = []
    model_config = ConfigDict(from_attributes=True)


class ProjectListOut(BaseModel):
    id: str
    client_name: str
    title: str
    project_type: ProjectType
    status: ProjectStatus
    duration_weeks: int
    created_at: datetime
    progress_percent: int = 0
    model_config = ConfigDict(from_attributes=True)


class ProjectStatusUpdate(BaseModel):
    status: ProjectStatus


# ---------- Public (client-facing, read-only) ----------

class PublicTaskOut(BaseModel):
    week_number: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    evidence_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class PublicProjectOut(BaseModel):
    title: str
    project_type: ProjectType
    description: str
    status: ProjectStatus
    duration_weeks: int
    duration_days: int
    owner_name: str
    progress_percent: int
    tasks: list[PublicTaskOut] = []
    model_config = ConfigDict(from_attributes=True)
