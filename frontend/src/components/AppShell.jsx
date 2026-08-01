import { Link, useNavigate } from "react-router-dom";
import { LayoutGrid, FolderKanban, Settings as SettingsIcon, LogOut, Plus } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AppShell({ eyebrow, title, actions, children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ background: "var(--gradient)", padding: "20px 32px 90px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1180, margin: "0 auto" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#fff", display: "grid", placeItems: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--grad-3)", fontSize: 15 }}>C</span>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>ClientTrack</span>
          </Link>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)", color: "#fff" }}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "-64px auto 0", padding: "0 24px 64px", display: "grid", gridTemplateColumns: "76px 1fr", gap: 20 }} className="shell-grid">
        <nav className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 12px", height: "fit-content", boxShadow: "var(--shadow-card)" }}>
          <SideIcon to="/" icon={<LayoutGrid size={19} />} label="Dashboard" />
          <SideIcon to="/projects/new" icon={<Plus size={19} />} label="New project" />
          <div style={{ flex: 1 }} />
          <SideIcon to="/settings" icon={<SettingsIcon size={19} />} label="Settings" />
        </nav>

        <main>
          <div className="card" style={{ boxShadow: "var(--shadow-card)", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                {eyebrow && <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>{eyebrow}</p>}
                <h1 style={{ fontSize: 26 }}>{title}</h1>
              </div>
              {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
            </div>
          </div>
          {children}
        </main>
      </div>
      <style>{`
        @media (max-width: 720px) {
          .shell-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function SideIcon({ to, icon, label }) {
  return (
    <Link to={to} title={label} style={{ width: 44, height: 44, borderRadius: 13, display: "grid", placeItems: "center", color: "var(--ink)", background: "transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
    </Link>
  );
}
