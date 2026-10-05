import { useForm } from "../hooks";
import { pick } from "../utils";
import Field from "./Field";

const blank = { name: "", date: "", location: "", description: "" };

export default function EventForm({ initial, onSubmit, onCancel, submitLabel }) {
  const { form, handleChange, handleSubmit, saving, error } = useForm(pick(blank, initial), onSubmit);

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Event name">
        <input name="name" value={form.name} onChange={handleChange} required />
      </Field>
      <div className="row">
        <Field label="Date">
          <input name="date" type="date" value={form.date} onChange={handleChange} required />
        </Field>
        <Field label="Location">
          <input name="location" value={form.location} onChange={handleChange} />
        </Field>
      </div>
      <Field label="Description (optional)">
        <textarea name="description" rows="3" value={form.description} onChange={handleChange} />
      </Field>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : submitLabel}</button>
      </div>
    </form>
  );
}
