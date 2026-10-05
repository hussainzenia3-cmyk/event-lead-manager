from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Profile
from ..schemas import ProfileIn, ProfileOut

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileOut | None)
def get_profile(db: Session = Depends(get_db)):
    # returns null the first time, the frontend then shows the setup form
    return db.scalar(select(Profile).limit(1))


@router.put("", response_model=ProfileOut)
def save_profile(data: ProfileIn, db: Session = Depends(get_db)):
    profile = db.scalar(select(Profile).limit(1))
    if profile is None:
        profile = Profile(**data.model_dump())
        db.add(profile)
    else:
        for key, value in data.model_dump().items():
            setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile
