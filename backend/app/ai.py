import json
import os
import time

from google import genai
from google.genai import errors

PERSON_PROMPT = """You help someone review their notes after a business networking event.

You will get JSON containing one person they met at the event.

Reply with ONLY valid JSON, no markdown, in exactly this shape:
{"summary": "1-2 sentences about the conversation"}

Rules:
- Only use what is written in the notes. Do not invent details.
- If the notes mention a next step such as a demo, introduction, pricing discussion, or call, include it.
- Keep the summary concise and professional.
"""



def summarize_event(event, leads):
    """Summarise each lead separately using Gemini.

    Returns:
        {
            "overview": str,
            "summaries": {lead_id: str},
            "used_ai": bool
        }
    """

    api_key = os.getenv("GEMINI_API_KEY")

    # If there is no API key, use the local fallback.
    if not api_key:
        return _basic_summary(leads)

    client = genai.Client(api_key=api_key)

    summaries = {}
    used_ai = False

    for lead in leads:
        payload = {
            "event": event.name,
            "person": {
                "id": lead.id,
                "name": lead.name,
                "company": lead.company,
                "follow_up_status": lead.follow_up_status,
                "notes": lead.notes,
            },
        }

        try:
            summary = _summarize_one_lead(client, payload)

            summaries[lead.id] = summary
            used_ai = True

        except Exception:
            # If Gemini fails for this person, keep the app usable
            # by falling back to their original notes.
            summaries[lead.id] = _fallback_lead_summary(lead)

    overview = f"You met {len(leads)} people at {event.name}."

    return {
        "overview": overview,
        "summaries": summaries,
        "used_ai": used_ai,
    }


def _summarize_one_lead(client, payload):
    """Send one person's notes to Gemini."""

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=[
                    PERSON_PROMPT,
                    json.dumps(payload),
                ],
            )

            data = _parse_json(response.text)
            return data["summary"]

        except errors.ServerError:
            # Retry temporary Gemini server errors such as 503.
            if attempt == 2:
                raise

            time.sleep(2)

        except errors.ClientError as exc:
            # 429 means quota/rate limit. Retrying immediately
            # will not help, so fail this lead and use its fallback.
            if exc.code == 429:
                raise

            # Other client errors should also fall back rather
            # than repeatedly sending the same invalid request.
            raise


def _parse_json(text):
    """Extract JSON even if the model adds surrounding text."""

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("AI response did not contain JSON")

    return json.loads(text[start:end + 1])


def _fallback_lead_summary(lead):
    """Use the original notes when Gemini is unavailable."""

    text = (lead.notes or "").strip()

    if not text:
        return "No interaction notes were recorded."

    if len(text) <= 160:
        return text

    return text[:157] + "..."


def _basic_summary(leads):
    """Fallback used when no Gemini API key is configured."""

    summaries = {}

    for lead in leads:
        summaries[lead.id] = _fallback_lead_summary(lead)

    overview = f"You met {len(leads)} people at this event."

    return {
        "overview": overview,
        "summaries": summaries,
        "used_ai": False,
    }