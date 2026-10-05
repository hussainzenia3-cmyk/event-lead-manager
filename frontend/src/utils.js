export const STATUSES = [
  { value: "not_contacted", label: "Not contacted" },
  { value: "follow_up_needed", label: "Follow-up needed" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "converted", label: "Converted" },
];

export function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label || value;
}

export function formatDate(iso) {
  // the API sends "2026-09-24", adding UTC avoids the date shifting by a day
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// keeps only the keys that exist in `blank`, so edit forms don't send extra fields
export function pick(blank, source) {
  return Object.fromEntries(Object.keys(blank).map((key) => [key, source?.[key] ?? blank[key]]));
}
