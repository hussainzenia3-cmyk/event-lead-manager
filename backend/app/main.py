from dotenv import load_dotenv

load_dotenv()  # must run before the app modules read their settings

import os  # noqa: E402

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from . import models  # noqa: E402,F401  (imported so the tables get registered)
from .database import Base, engine  # noqa: E402
from .routers import events, leads, profile  # noqa: E402

# Simple setup: create tables on startup. A bigger project would use Alembic migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Event Lead Manager API")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(events.router)
app.include_router(leads.router)


@app.get("/")
def health():
    return {"status": "ok"}
