const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// small wrapper so every call handles errors the same way
async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = "Something went wrong";
    try {
      const data = await res.json();
      // FastAPI sends either a string or a list of validation errors
      message = typeof data.detail === "string" ? data.detail : data.detail?.[0]?.msg || message;
    } catch {
      // response had no JSON body, keep the default message
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

// turns { search: "abc", status: "" } into "?search=abc" and skips empty values
function toQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const text = query.toString();
  return text ? "?" + text : "";
}

const send = (method, body) => ({ method, body: JSON.stringify(body) });

export const api = {
  getProfile: () => request("/profile"),
  saveProfile: (data) => request("/profile", send("PUT", data)),

  getEvents: (filters) => request("/events" + toQuery(filters)),
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (data) => request("/events", send("POST", data)),
  updateEvent: (id, data) => request(`/events/${id}`, send("PATCH", data)),
  deleteEvent: (id) => request(`/events/${id}`, { method: "DELETE" }),
  summarizeEvent: (id) => request(`/events/${id}/summarize`, { method: "POST" }),

  getLeads: (eventId, filters) => request(`/events/${eventId}/leads` + toQuery(filters)),
  createLead: (eventId, data) => request(`/events/${eventId}/leads`, send("POST", data)),
  updateLead: (id, data) => request(`/leads/${id}`, send("PATCH", data)),
  deleteLead: (id) => request(`/leads/${id}`, { method: "DELETE" }),
};
