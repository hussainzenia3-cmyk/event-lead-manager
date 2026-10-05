import { statusLabel } from "../utils";

export default function SummaryPanel({ overview, leads, notice, onHide }) {
  const summarised = leads.filter((lead) => lead.ai_summary);

  return (
    <section className="card summary">
      <div className="section-head">
        <h2>AI interaction summary</h2>
        <button className="btn" onClick={onHide}>Hide</button>
      </div>

      {notice && <div className="notice">{notice}</div>}
      <p>{overview}</p>

      {summarised.map((lead) => (
        <div className="summary-row" key={lead.id}>
          <div className="summary-who">
            <strong>{lead.name}</strong>
            <span className="muted">{lead.company}</span>
            <span className={`badge status-${lead.follow_up_status}`}>{statusLabel(lead.follow_up_status)}</span>
          </div>
          <p>{lead.ai_summary}</p>
        </div>
      ))}
    </section>
  );
}
