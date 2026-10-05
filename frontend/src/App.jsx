import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { api } from "./api";
import EventPage from "./components/EventPage";
import EventsPage from "./components/EventsPage";
import ProfileForm from "./components/ProfileForm";

export default function App() {
  // undefined = still loading, null = no profile created yet
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProfile().then(setProfile).catch((err) => setError(err.message));
  }, []);

  let content;
  if (error) {
    content = (
      <div className="notice notice-error">
        Could not reach the API ({error}). Check that the backend is running and VITE_API_URL is correct.
      </div>
    );
  } else if (profile === undefined) {
    content = <p className="muted">Loading...</p>;
  } else if (profile === null) {
    content = (
      <div className="welcome">
        <h1>Welcome</h1>
        <p className="muted">Set up your profile to start tracking the people you meet at events.</p>
        <div className="card">
          <ProfileForm
            submitLabel="Save profile"
            onSubmit={async (data) => setProfile(await api.saveProfile(data))}
          />
        </div>
      </div>
    );
  } else {
    content = (
      <Routes>
        <Route path="/" element={<EventsPage profile={profile} onProfileChange={setProfile} />} />
        <Route path="/events/:eventId" element={<EventPage />} />
      </Routes>
    );
  }

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">Event Lead Manager</Link>
      </header>
      <main className="container">{content}</main>
    </>
  );
}
