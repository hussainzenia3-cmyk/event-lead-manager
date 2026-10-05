from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Event, Lead
from ..schemas import LeadIn, LeadOut, LeadUpdate, Status

router = APIRouter(tags=["leads"])


def get_lead_or_404(db: Session, lead_id: int) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Person not found")
    return lead


def check_event_exists(db: Session, event_id: int):
    if db.get(Event, event_id) is None:
        raise HTTPException(status_code=404, detail="Event not found")


@router.get("/events/{event_id}/leads", response_model=list[LeadOut])
def list_leads(
    event_id: int,
    search: str = "",
    status: Status | None = None,
    db: Session = Depends(get_db),
):
    check_event_exists(db, event_id)
    query = select(Lead).where(Lead.event_id == event_id).order_by(Lead.created_at.desc())

    if search:
        like = f"%{search}%"
        query = query.where(
            or_(Lead.name.ilike(like), Lead.company.ilike(like), Lead.email.ilike(like))
        )
    if status:
        query = query.where(Lead.follow_up_status == status)

    return db.scalars(query).all()


@router.post("/events/{event_id}/leads", response_model=LeadOut, status_code=201)
def create_lead(event_id: int, data: LeadIn, db: Session = Depends(get_db)):
    check_event_exists(db, event_id)
    lead = Lead(event_id=event_id, **data.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/leads/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: int, data: LeadUpdate, db: Session = Depends(get_db)):
    lead = get_lead_or_404(db, lead_id)
    changes = data.model_dump(exclude_unset=True)

    # an old AI summary would be wrong once the notes change
    if "notes" in changes and changes["notes"] != lead.notes:
        lead.ai_summary = None

    for key, value in changes.items():
        setattr(lead, key, value)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/leads/{lead_id}", status_code=204)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    db.delete(get_lead_or_404(db, lead_id))
    db.commit()
    return Response(status_code=204)
