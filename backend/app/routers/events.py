import datetime as dt
import logging

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from .. import ai
from ..database import get_db
from ..models import Event
from ..schemas import EventIn, EventOut, EventUpdate, LeadOut, SummaryOut

router = APIRouter(prefix="/events", tags=["events"])
logger = logging.getLogger(__name__)


def to_event_out(event: Event) -> EventOut:
    # count how many people are in each follow-up status
    counts: dict[str, int] = {}
    for lead in event.leads:
        counts[lead.follow_up_status] = counts.get(lead.follow_up_status, 0) + 1

    return EventOut(
        id=event.id,
        name=event.name,
        date=event.date,
        location=event.location,
        description=event.description,
        ai_overview=event.ai_overview,
        total_leads=len(event.leads),
        status_counts=counts,
    )


def get_event_or_404(db: Session, event_id: int) -> Event:
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("", response_model=list[EventOut])
def list_events(
    search: str = "",
    date_from: dt.date | None = None,
    date_to: dt.date | None = None,
    db: Session = Depends(get_db),
):
    query = select(Event).options(selectinload(Event.leads)).order_by(Event.date.desc())

    if search:
        like = f"%{search}%"
        query = query.where(or_(Event.name.ilike(like), Event.location.ilike(like)))
    if date_from:
        query = query.where(Event.date >= date_from)
    if date_to:
        query = query.where(Event.date <= date_to)

    return [to_event_out(event) for event in db.scalars(query)]


@router.post("", response_model=EventOut, status_code=201)
def create_event(data: EventIn, db: Session = Depends(get_db)):
    event = Event(**data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return to_event_out(event)


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    return to_event_out(get_event_or_404(db, event_id))


@router.patch("/{event_id}", response_model=EventOut)
def update_event(event_id: int, data: EventUpdate, db: Session = Depends(get_db)):
    event = get_event_or_404(db, event_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return to_event_out(event)


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    db.delete(get_event_or_404(db, event_id))
    db.commit()
    return Response(status_code=204)


@router.post("/{event_id}/summarize", response_model=SummaryOut)
def summarize_event(event_id: int, db: Session = Depends(get_db)):
    event = get_event_or_404(db, event_id)

    # nothing to summarise for people without notes
    leads = [lead for lead in event.leads if lead.notes.strip()]
    if not leads:
        raise HTTPException(status_code=400, detail="Add interaction notes for at least one person first.")

    try:
        result = ai.summarize_event(event, leads)
    except Exception:
        logger.exception("AI summary failed")
        raise HTTPException(status_code=502, detail="The AI service failed. Please try again in a moment.")

    # keep the original notes, store the summary next to them
    for lead in leads:
        summary = result["summaries"].get(lead.id)
        if summary:
            lead.ai_summary = summary
    event.ai_overview = result["overview"]
    db.commit()

    return SummaryOut(
        overview=event.ai_overview,
        leads=[LeadOut.model_validate(lead) for lead in leads],
        used_ai=result["used_ai"],
    )
