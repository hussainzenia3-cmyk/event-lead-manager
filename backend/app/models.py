import datetime as dt

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow():
    return dt.datetime.now(dt.timezone.utc)


class Profile(Base):
    """The person using the app. There is only ever one row (no login in this version)."""

    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(120), default="")
    company: Mapped[str] = mapped_column(String(120), default="")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    date: Mapped[dt.date]
    location: Mapped[str] = mapped_column(String(200), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    ai_overview: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(default=utcnow)

    # deleting an event also deletes the people met there
    leads: Mapped[list["Lead"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", order_by="Lead.created_at.desc()"
    )


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    company: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(200))
    notes: Mapped[str] = mapped_column(Text, default="")
    follow_up_status: Mapped[str] = mapped_column(String(30), default="not_contacted")
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(default=utcnow, onupdate=utcnow)

    event: Mapped["Event"] = relationship(back_populates="leads")
