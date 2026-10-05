import json
import os
import time
from google import genai


SYSTEM_PROMPT = """You help someone review their notes after a business networking event.
You will get JSON with the event name and the people they met (id, name, company, follow_up_status, notes).

Reply with ONLY valid JSON, no markdown, in exactly this shape:
{"overview": "2-3 sentences about the event as a whole",
 "summaries": [{"id": 1, "summary": "1-2 sentences about that conversation"}]}

Rules:
- Only use what is written in the notes. Do not invent details.
- If the notes mention a next step (demo, intro, pricing, call), include it.
- Write one summary for every person you were given, using the same id."""


def summarize_event(event, leads):
    """Summarise the notes of every lead in one event.

    Returns {"overview": str, "summaries": {lead_id: str}, "used_ai": bool}
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return _basic_summary(leads)

    payload = {
        "event": event.name,
        "people": [
            {
                "id": lead.id,
                "name": lead.name,
                "company": lead.company,
                "follow_up_status": lead.follow_up_status,
                "notes": lead.notes,
            }
            for lead in leads
        ],
    }

    client = genai.Client(api_key=api_key)

     # Retry temporary Gemini failures such as 503 UNAVAILABLE.
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=[
                    SYSTEM_PROMPT,
                    json.dumps(payload),
                ],
            )
            break

        except Exception:
            if attempt == 2:
                raise

            time.sleep(2)

    data = _parse_json(response.text)
    summaries = {
        int(item["id"]): item["summary"]
        for item in data["summaries"]
    }

    return {
        "overview": data["overview"],
        "summaries": summaries,
        "used_ai": True,
    }


def _parse_json(text):
    # Models sometimes wrap the JSON in extra text,
    # so cut out the outer { ... }.
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("AI response did not contain JSON")
    return json.loads(text[start : end + 1])


def _basic_summary(leads):
    """Used when there is no API key, so the app still works locally."""
    summaries = {}

    for lead in leads:
        text = lead.notes.strip()
        summaries[lead.id] = (
            text if len(text) <= 160 else text[:157] + "..."
        )

    overview = f"You met {len(leads)} people at this event."

    return {
        "overview": overview,
        "summaries": summaries,
        "used_ai": False,
    }