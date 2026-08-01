import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowUpRight, FolderOpen } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { api } from "../api/client.js";

const TYPE_LABELS = {
  landing_page: "Landing page",
  full_website: "Full website",
  web_app: "Web app",
  mobile_app: "Mobile app",
  branding: "Branding",
  other: "Other",
};

const STATUS_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  on_hold: "On hold",
};

const BAR_COLORS = ["var(--accent-purple)", "var(--accent-coral)", "var(--accent-blue)"];

export default function Dashboard() {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listProjects().then(setProjects).catch((e) => setError(e.message));
  }, []);

  const counts = (projects || []).reduce(
    (acc, p) => ({ ...acc, [p.status]: (acc[p.status] || 0) + 1 }),
    {}
  );

  return (
    <AppShell
      eyebrow="Manage and track your client work"
      title="Project Dashboard"
      actions={
        <Link to="/projects/new" className="btn btn-primary">
          <Plus size={16} /> New project
        </Link>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }} className="stat-grid">
        <StatCard label="Total projects" value={projects?.length ?? "—"} />
        <StatCard label="In progress" value={counts.in_progress ?? 0} color="var(--accent-blue)" />
        <StatCard label="Completed" value={counts.completed ?? 0} color="var(--accent-green)" />
        <StatCard label="Not started" value={counts.not_started ?? 0} color="var(--muted)" />
      </div>

      <div className="card" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 style={{ fontSize: 17, marginBottom: 18 }}>My Projects</h3>

        {error && <p style={{ color: "var(--accent-coral)" }}>{error}</p>}

        {projects && projects.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 12px", color: "var(--muted)" }}>
            <FolderOpen size={30} style={{ marginBottom: 10, opacity: 0.6 }} />
            <p style={{ marginBottom: 16 }}>No projects yet. Start one and share the link with your client.</p>
            <Link to="/projects/new" className="btn btn-gradient">
              <Plus size={16} /> Create your first project
            </Link>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {projects?.map((p, i) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 160px auto",
                alignItems: "center",
                gap: 18,
                padding: "16px 18px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
              }}
              className="project-row"
            >
              <div>
                <p style={{ fontWeight: 700, color: "var(--ink)", fontSize: 15, marginBottom: 3 }}>{p.title}</p>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  {p.client_name} · {TYPE_LABELS[p.project_type]} · {p.duration_weeks}w
                </p>
              </div>
              <span className={`badge badge-${p.status}`}>{STATUS_LABELS[p.status]}</span>
              <div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${p.progress_percent}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>{p.progress_percent}% complete</p>
              </div>
              <ArrowUpRight size={18} color="var(--muted)" />
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        .project-row:hover { border-color: var(--grad-3); }
        @media (max-width: 720px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </AppShell>
  );
}

function StatCard({ label, value, color = "var(--ink)" }) {
  return (
    <div className="card" style={{ boxShadow: "var(--shadow-card)" }}>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}
