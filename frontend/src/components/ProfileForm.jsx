import { useForm } from "../hooks";
import { pick } from "../utils";
import Field from "./Field";

const blank = { name: "", email: "", role: "", company: "" };

export default function ProfileForm({ initial, onSubmit, onCancel, submitLabel = "Save changes" }) {
  const { form, handleChange, handleSubmit, saving, error } = useForm(pick(blank, initial), onSubmit);

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Name">
        <input name="name" value={form.name} onChange={handleChange} required />
      </Field>
      <Field label="Email">
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
      </Field>
      <Field label="Role">
        <input name="role" value={form.role} onChange={handleChange} placeholder="e.g. Student, Sales lead" />
      </Field>
      <Field label="Company or college">
        <input name="company" value={form.company} onChange={handleChange} />
      </Field>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancel</button>}
        <button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : submitLabel}</button>
      </div>
    </form>
  );
}
