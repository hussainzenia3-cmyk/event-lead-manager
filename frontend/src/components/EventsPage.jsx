import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { formatDate, greeting } from "../utils";
import EventForm from "./EventForm";
import Modal from "./Modal";
import ProfileCard from "./ProfileCard";
import ProfileForm from "./ProfileForm";

export default function EventsPage({ profile, onProfileChange }) {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // "addEvent" | "editProfile" | null

  async function loadEvents() {
    try {
      const data = await api.getEvents({ search, date_from: dateFrom, date_to: dateTo });
      setEvents(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // wait a little after typing so we don't call the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(loadEvents, 300);
    return () => clearTimeout(timer);
  }, [search, dateFrom, dateTo]);

  async function handleAddEvent(data) {
    await api.createEvent(data);
    setModal(null);
    loadEvents();
  }

  async function handleDeleteEvent(event) {
    if (!window.confirm(`Delete "${event.name}" and everyone you met there?`)) return;
    try {
      await api.deleteEvent(event.id);
      loadEvents();
    } catch (err) {
      setError(err.message);
    }
  }

  const filtersActive = search || dateFrom || dateTo;

  return (
    <>
      <h1>{greeting()}, {profile.name.split(" ")[0]}</h1>
      <ProfileCard profile={profile} onEdit={() => setModal("editProfile")} />

      <div className="section-head">
        <h2>Your events</h2>
        <button className="btn btn-primary" onClick={() => setModal("addEvent")}>+ Add event</button>
      </div>

      <div className="toolbar">
        <input
          className="grow"
          placeholder="Search events by name or location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="date-filter">
          From <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="date-filter">
          To <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading events...</p>}

      {!loading && events.length === 0 && (
        <div className="empty">
          {filtersActive ? "No events match your filters." : "No events yet. Add the first event you attend."}
        </div>
      )}

      <div className="list">
        {events.map((event) => (
          <div className="card event-card" key={event.id}>
            <div>
              <h3>{event.name}</h3>
              <p className="muted">
                {event.location ? `${event.location}, ` : ""}{formatDate(event.date)}
              </p>
            </div>
            <div className="stats">
              <span><b>{event.total_leads}</b> people met</span>
              <span><b>{event.status_counts.follow_up_needed || 0}</b> follow-ups pending</span>
              <span><b>{event.status_counts.contacted || 0}</b> contacted</span>
            </div>
            <div className="actions">
              <Link className="btn btn-primary" to={`/events/${event.id}`}>View event</Link>
              <button className="btn btn-text-danger" onClick={() => handleDeleteEvent(event)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {modal === "addEvent" && (
        <Modal title="Add event" onClose={() => setModal(null)}>
          <EventForm submitLabel="Create event" onSubmit={handleAddEvent} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {modal === "editProfile" && (
        <Modal title="Edit profile" onClose={() => setModal(null)}>
          <ProfileForm
            initial={profile}
            onCancel={() => setModal(null)}
            onSubmit={async (data) => {
              onProfileChange(await api.saveProfile(data));
              setModal(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
