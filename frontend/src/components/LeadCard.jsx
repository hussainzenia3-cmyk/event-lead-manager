import { STATUSES } from "../utils";

export default function LeadCard({ lead, onEdit, onDelete, onStatusChange }) {
  return (
    <div className="card lead-card">
      <div className="lead-top">
        <div>
          <h3>{lead.name}</h3>
          <p className="muted">{lead.company}</p>
          <a href={`mailto:${lead.email}`}>{lead.email}</a>
        </div>
        {/* status can be changed right on the card, no need to open the edit form */}
        <select
          className={`status-select status-${lead.follow_up_status}`}
          value={lead.follow_up_status}
          onChange={(e) => onStatusChange(lead, e.target.value)}
          aria-label={`Follow-up status for ${lead.name}`}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <p className="notes">{lead.notes || <span className="muted">No notes yet.</span>}</p>

      <div className="actions">
        <button className="btn" onClick={() => onEdit(lead)}>Edit</button>
        <button className="btn btn-text-danger" onClick={() => onDelete(lead)}>Delete</button>
      </div>
    </div>
  );
}
