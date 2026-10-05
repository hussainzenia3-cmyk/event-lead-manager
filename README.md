# Event Lead Manager

A small full-stack app for keeping track of the people you meet at business events, and getting an AI summary of those conversations afterwards. Built for the Even8 AI Native Full Stack Intern assignment.

- Live app: https://event-lead-manager-sage.vercel.app/
- API docs: https://event-lead-manager-2mf4.onrender.com/docs
- GitHub: https://github.com/hussainzenia3-cmyk/event-lead-manager
- Demo video: https://drive.google.com/file/d/1aYGEcmG0cGLoq-zD_tNSffvvJ75LwCtS/view?usp=drivesdk

# What it does

- Set up your own profile (name, email, role, company). It is shown on the home page.
- Create events and see how many people you met, how many follow-ups are pending and how many you already contacted.
- Search events and filter them by date range.
- Inside an event: add, edit, delete, search and filter people (name, company, email, notes, follow-up status).
- Change a person's follow-up status straight from their card.
- Summarize all interactions: one click gives an AI-generated overview of the event plus a short summary for every person, with their company and status. Original notes are never replaced.
- AI summaries are generated from the notes of everyone in an event in a single request.
- Temporary AI service failures are retried before the request is treated as failed.
- The app also has a basic text-summary fallback when no Gemini API key is configured.

## Tech stack

Frontend : React (Vite) + React Router, plain CSS 
Backend : Python FastAPI, SQLAlchemy 
Database : SQLite locally, PostgreSQL in production 
AI : Google Gemini through the google-genai Python SDK 
Deployment : Vercel (frontend) + Render (backend) 

Features

# Profile
- Create and save a personal profile.
- Stores name, email, role and company.
- Profile information is displayed on the home page.

# Event Management
- Create events with name, date, location and description.
- View all events from the dashboard.
- Search events.
- Filter events by date range.
- Edit and delete events.
- View the number of people met and follow-up status for each event.

# People / Leads
Inside each event, users can:

- Add people they met.
- Store name, company, email and interaction notes.
- Track follow-up status.
- Edit or delete people.
- Search by name or company.
- Filter people by follow-up status.
- Change follow-up status directly from a person's card.

# AI Interaction Summaries

The main AI feature is Summarize All Interactions.

With one click, the application:
- Generates an overview of the entire event.
- Generates a short summary for every person.
- Includes relevant company and follow-up information.
- Preserves the original interaction notes.
- Stores AI summaries separately.
- Clears an old AI summary when the corresponding notes are edited.
- Retries temporary Gemini API failures.
- Falls back to a basic text summary when no Gemini API key is available.
