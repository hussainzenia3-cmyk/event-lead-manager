import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { formatDate, STATUSES, statusLabel } from "../utils";
import EventForm from "./EventForm";
import LeadCard from "./LeadCard";
import LeadForm from "./LeadForm";
import Modal from "./Modal";
import SummaryPanel from "./SummaryPanel";

export default function EventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState(null); // "addLead" | "editEvent" | a lead object
  const [showSummary, setShowSummary] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadEvent = () => api.getEvent(eventId).then(setEvent);
  const loadLeads = () => api.getLeads(eventId, { search, status }).then(setLeads);

  // reload counts and people together after any change
  async function refresh() {
    try {
      await Promise.all([loadEvent(), loadLeads()]);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadEvent().catch((err) => setError(err.message));
  }, [eventId]);

  useEffect(() => {
    const timer = setTimeout(() => loadLeads().catch((err) => setError(err.message)), 300);
    return () => clearTimeout(timer);
  }, [eventId, search, status]);

  async function handleSaveLead(data) {
    if (modal === "addLead") {
      await api.createLead(eventId, data);
    } else {
      await api.updateLead(modal.id, data);
    }
    setModal(null);
    refresh();
  }

  async function handleStatusChange(lead, newStatus) {
    try {
      await api.updateLead(lead.id, { follow_up_status: newStatus });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteLead(lead) {
    if (!window.confirm(`Delete ${lead.name}?`)) return;
    try {
      await api.deleteLead(lead.id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEditEvent(data) {
    setEvent(await api.updateEvent(eventId, data));
    setModal(null);
  }

  async function handleDeleteEvent() {
    if (!window.confirm(`Delete "${event.name}" and everyone you met there?`)) return;
    try {
      await api.deleteEvent(eventId);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSummarize() {
    setSummarizing(true);
    setError("");
    try {
      const result = await api.summarizeEvent(eventId);
      setNotice(result.used_ai ? "" : "No API key found, so this is a basic summary. Add ANTHROPIC_API_KEY to the backend for AI summaries.");
      setShowSummary(true);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSummarizing(false);
    }
  }

  if (!event) {
    return error ? <p className="error">{error}</p> : <p className="muted">Loading...</p>;
  }

  const filtersActive = search || status;

  return (
    <>
      <Link to="/" className="back">Back to events</Link>

      <div className="page-head">
        <div>
          <h1>{event.name}</h1>
          <p className="muted">
            {event.location ? `${event.location}, ` : ""}{formatDate(event.date)}
          </p>
          {event.description && <p>{event.description}</p>}
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setModal("editEvent")}>Edit event</button>
          <button className="btn btn-text-danger" onClick={handleDeleteEvent}>Delete event</button>
        </div>
      </div>

      <div className="chips">
        <span className="chip"><b>{event.total_leads}</b> people met</span>
        {STATUSES.filter((s) => event.status_counts[s.value]).map((s) => (
          <span key={s.value} className={`chip status-${s.value}`}>
            <b>{event.status_counts[s.value]}</b> {statusLabel(s.value).toLowerCase()}
          </span>
        ))}
      </div>

      <div className="toolbar">
        <input
          className="grow"
          placeholder="Search by name, company or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={() => setModal("addLead")}>+ Add person</button>
        <button className="btn btn-ai" onClick={handleSummarize} disabled={summarizing || event.total_leads === 0}>
          {summarizing ? "Summarizing..." : "Summarize all interactions"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {event.ai_overview && showSummary && (
        <SummaryPanel
          overview={event.ai_overview}
          leads={leads}
          notice={notice}
          onHide={() => setShowSummary(false)}
        />
      )}
      {event.ai_overview && !showSummary && (
        <button className="btn" onClick={() => setShowSummary(true)}>Show AI summary</button>
      )}

      {leads.length === 0 && (
        <div className="empty">
          {filtersActive ? "Nobody matches your search." : "You haven't added anyone yet. Use Add person after you meet someone."}
        </div>
      )}

      <div className="list">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={setModal}
            onDelete={handleDeleteLead}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {modal === "editEvent" && (
        <Modal title="Edit event" onClose={() => setModal(null)}>
          <EventForm initial={event} submitLabel="Save changes" onSubmit={handleEditEvent} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {(modal === "addLead" || (modal && typeof modal === "object")) && (
        <Modal title={modal === "addLead" ? "Add person" : "Edit person"} onClose={() => setModal(null)}>
          <LeadForm
            initial={modal === "addLead" ? null : modal}
            submitLabel={modal === "addLead" ? "Save person" : "Save changes"}
            onSubmit={handleSaveLead}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </>
  );
}
