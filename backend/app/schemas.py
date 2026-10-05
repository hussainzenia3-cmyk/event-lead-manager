import datetime as dt
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Status = Literal["not_contacted", "follow_up_needed", "contacted", "replied", "converted"]


# ---------- profile ----------
class ProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    role: str = ""
    company: str = ""


class ProfileOut(ProfileIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- events ----------
class EventIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    date: dt.date
    location: str = ""
    description: str = ""


class EventUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    date: dt.date | None = None
    location: str | None = None
    description: str | None = None


class EventOut(BaseModel):
    id: int
    name: str
    date: dt.date
    location: str
    description: str
    ai_overview: str | None
    total_leads: int
    status_counts: dict[str, int]


# ---------- leads (people met at an event) ----------
class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    company: str = Field(min_length=1, max_length=120)
    email: EmailStr
    notes: str = ""
    follow_up_status: Status = "not_contacted"


class LeadUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    company: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    notes: str | None = None
    follow_up_status: Status | None = None


class LeadOut(LeadIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_id: int
    ai_summary: str | None
    created_at: dt.datetime
    updated_at: dt.datetime


class SummaryOut(BaseModel):
    overview: str
    leads: list[LeadOut]
    used_ai: bool  # False means the API key is missing and a basic fallback was used
