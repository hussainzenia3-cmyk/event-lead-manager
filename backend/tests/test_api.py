import os

# use a throwaway database and make sure no real AI call is made
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ.pop("ANTHROPIC_API_KEY", None)

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return TestClient(app)


def make_event(client):
    res = client.post("/events", json={"name": "SaaS Summit", "date": "2026-09-24", "location": "Mumbai"})
    assert res.status_code == 201
    return res.json()["id"]


def make_lead(client, event_id, **overrides):
    body = {"name": "Sarah Johnson", "company": "NovaTech", "email": "sarah@novatech.com", "notes": "Wants a demo"}
    body.update(overrides)
    return client.post(f"/events/{event_id}/leads", json=body)


def test_profile_starts_empty_then_saves(client):
    assert client.get("/profile").json() is None
    res = client.put("/profile", json={"name": "Test User", "email": "test@example.com"})
    assert res.status_code == 200
    assert client.get("/profile").json()["name"] == "Test User"


def test_lead_crud_search_and_filter(client):
    event_id = make_event(client)
    lead = make_lead(client, event_id).json()
    make_lead(client, event_id, name="Arjun Mehta", company="FinEdge", email="arjun@finedge.com")

    assert len(client.get(f"/events/{event_id}/leads").json()) == 2
    assert len(client.get(f"/events/{event_id}/leads", params={"search": "finedge"}).json()) == 1

    client.patch(f"/leads/{lead['id']}", json={"follow_up_status": "replied"})
    replied = client.get(f"/events/{event_id}/leads", params={"status": "replied"}).json()
    assert [l["name"] for l in replied] == ["Sarah Johnson"]

    assert client.delete(f"/leads/{lead['id']}").status_code == 204
    assert len(client.get(f"/events/{event_id}/leads").json()) == 1


def test_invalid_email_is_rejected(client):
    event_id = make_event(client)
    assert make_lead(client, event_id, email="not-an-email").status_code == 422


def test_summarize_saves_summary_and_keeps_notes(client):
    event_id = make_event(client)
    make_lead(client, event_id)

    res = client.post(f"/events/{event_id}/summarize")
    assert res.status_code == 200
    body = res.json()
    assert body["used_ai"] is False  # no API key in tests
    assert body["leads"][0]["notes"] == "Wants a demo"
    assert body["leads"][0]["ai_summary"]


def test_summarize_without_notes_returns_400(client):
    event_id = make_event(client)
    make_lead(client, event_id, notes="")
    assert client.post(f"/events/{event_id}/summarize").status_code == 400
