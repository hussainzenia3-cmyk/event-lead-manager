export default function ProfileCard({ profile, onEdit }) {
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="card profile-card">
      <div className="avatar">{initials}</div>
      <div className="profile-info">
        <strong>{profile.name}</strong>
        <span className="muted">{[profile.role, profile.company].filter(Boolean).join(", ")}</span>
        <span className="muted">{profile.email}</span>
      </div>
      <button className="btn" onClick={onEdit}>Edit profile</button>
    </div>
  );
}
