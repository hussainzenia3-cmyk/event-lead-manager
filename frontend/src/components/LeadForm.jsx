import { useForm } from "../hooks";
import { pick, STATUSES } from "../utils";
import Field from "./Field";

const blank = { name: "", company: "", email: "", notes: "", follow_up_status: "not_contacted" };

export default function LeadForm({ initial, onSubmit, onCancel, submitLabel }) {
  const { form, handleChange, handleSubmit, saving, error } = useForm(pick(blank, initial), onSubmit);

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <Field label="Name">
          <input name="name" value={form.name} onChange={handleChange} required />
        </Field>
        <Field label="Company">
          <input name="company" value={form.company} onChange={handleChange} required />
        </Field>
      </div>
      <Field label="Email">
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
      </Field>
      <Field label="Interaction notes">
        <textarea
          name="notes"
          rows="5"
          value={form.notes}
          onChange={handleChange}
          placeholder="What did you talk about? Any next steps?"
        />
      </Field>
      <Field label="Follow-up status">
        <select name="follow_up_status" value={form.follow_up_status} onChange={handleChange}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </Field>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : submitLabel}</button>
      </div>
    </form>
  );
}
