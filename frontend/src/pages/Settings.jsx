import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api/client.js";

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getMe().then(setUser).catch((e) => setError(e.message));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <AppShell eyebrow="Your account" title="Settings">
      <div className="card" style={{ boxShadow: "var(--shadow-card)", maxWidth: 480 }}>
        {error && <p style={{ color: "var(--accent-coral)" }}>{error}</p>}
        {user && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Name</p>
              <p style={{ fontWeight: 600 }}>{user.full_name}</p>
            </div>
            <div>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Email</p>
              <p style={{ fontWeight: 600 }}>{user.email}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ alignSelf: "flex-start", marginTop: 8 }}>
              <LogOut size={14} /> Log out
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}