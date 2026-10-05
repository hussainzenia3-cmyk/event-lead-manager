# Event Lead Manager

A small full-stack app for keeping track of the people you meet at business events, and getting an AI summary of those conversations afterwards. Built for the Even8 AI Native Full Stack Intern assignment.

- **Live app:** _add your deployed link here_
- **API docs:** _your backend URL_/docs
- **Demo video (optional):** _add link here_

## What it does

- Set up your own profile (name, email, role, company). It is shown on the home page.
- Create events and see how many people you met, how many follow-ups are pending and how many you already contacted.
- Search events and filter them by date range.
- Inside an event: add, edit, delete, search and filter people (name, company, email, notes, follow-up status).
- Change a person's follow-up status straight from their card.
- **Summarize all interactions**: one click gives an overview of the event plus a short summary for every person, with their company and status. Original notes are never replaced.

## Tech stack

| Part | Choice |
| --- | --- |
| Frontend | React (Vite) + React Router, plain CSS |
| Backend | Python FastAPI, SQLAlchemy |
| Database | SQLite locally, PostgreSQL in production (just change `DATABASE_URL`) |
| AI | Anthropic Claude (Haiku) through the `anthropic` Python SDK |

## Project structure

```
backend/
  app/
    main.py          app setup, CORS, routers
    database.py      engine and session
    models.py        Profile, Event, Lead tables
    schemas.py       request/response validation (Pydantic)
    ai.py            the AI summary logic
    routers/         profile.py, events.py, leads.py
  tests/test_api.py
frontend/
  src/
    api.js           all fetch calls in one place
    components/      pages, forms, cards
```

## Running it locally

You need Python 3.10+ and Node 18+.

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

The API runs on http://localhost:8000 and the interactive docs are at http://localhost:8000/docs. Tables are created automatically on first start.

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

**Tests**

```bash
cd backend
pytest
```

### Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | backend | Enables real AI summaries. Without it a basic fallback is used so the app still runs. |
| `AI_MODEL` | backend | Optional, defaults to `claude-haiku-4-5-20251001` |
| `DATABASE_URL` | backend | Defaults to `sqlite:///./leads.db` |
| `CORS_ORIGINS` | backend | Comma separated frontend URLs, e.g. your Vercel link |
| `VITE_API_URL` | frontend | URL of the backend |

## API

| Method | Route | What it does |
| --- | --- | --- |
| GET / PUT | `/profile` | Get or save your profile |
| GET / POST | `/events` | List events (`search`, `date_from`, `date_to`) or create one |
| GET / PATCH / DELETE | `/events/{id}` | Read, edit or delete an event |
| GET / POST | `/events/{id}/leads` | List people (`search`, `status`) or add one |
| PATCH / DELETE | `/leads/{id}` | Edit (including status) or delete a person |
| POST | `/events/{id}/summarize` | Run the AI summary for the event |

## How the AI part works

1. Click **Summarize all interactions** on an event page.
2. React calls `POST /events/{id}/summarize`.
3. FastAPI loads everyone in that event who has notes and sends them to Claude in a **single request**, with an instruction to answer in JSON: one overview for the event and one short summary per person.
4. The response is parsed, each summary is saved in the `ai_summary` column of that person, and the overview is saved on the event.
5. React reloads and shows the summary panel.

Notes on how it behaves:
- The original notes stay untouched. The summary is stored next to them.
- If someone's notes are edited later, their old summary is cleared so it never shows outdated information.
- The prompt tells the model to only use what is in the notes.
- If the AI call fails the API returns a clear error and the UI shows it.

## Key decisions

- **Event is the main object.** A person always belongs to an event, so the "Add person" form does not ask for the event again. The assignment lists "event" as a lead field, and here it is stored as `event_id` linking to the Events table.
- **Summarizing per event, not per person.** Notes from the whole event go in one request. It is cheaper, faster, and gives a useful overview of the event as well.
- **Only the summary feature.** The assignment says summary _or_ follow-up message, so I did one feature properly instead of two quickly.
- **Single user, no login.** The profile is one row in the database. Adding authentication would be the first thing to do if more than one person used it. I left it out to stay within the recommended time.
- **SQLite locally, Postgres in production.** SQLAlchemy lets me switch with one environment variable. Free hosts wipe the disk on redeploy, so SQLite is not good for the deployed version.
- **Fallback summary without an API key.** Anyone cloning the repo can run it without paying for an API key, and the UI tells them it is a basic summary.
- **Search is done in the database** (`ILIKE` queries), with a short delay after typing so the API is not called on every key press.
- **Tables are created on startup.** For a bigger project I would use Alembic migrations.
- **Status is validated** on the backend, so only the five allowed values can be saved.

## Deploying

- **Backend (Render):** root directory `backend`, build command `pip install -r requirements.txt`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Add a PostgreSQL database and set `DATABASE_URL`, `ANTHROPIC_API_KEY` and `CORS_ORIGINS`.
- **Frontend (Vercel):** root directory `frontend`, set `VITE_API_URL` to the Render URL. `vercel.json` handles page refreshes on routes like `/events/1`.

## What I would add next

- Login, so each user only sees their own events.
- Export leads to CSV.
- AI-drafted follow-up messages.
- Frontend tests and database migrations.
