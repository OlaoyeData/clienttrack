import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Circle, Loader2, Compass, ExternalLink } from "lucide-react";
import { api } from "../api/client.js";

const STATUS_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  on_hold: "On hold",
};

const TYPE_LABELS = {
  landing_page: "Landing page",
  full_website: "Full website",
  web_app: "Web app",
  mobile_app: "Mobile app",
  branding: "Branding",
  other: "Project",
};

export default function PublicTracker() {
  const { shareToken } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPublicProject(shareToken).then(setProject).catch((e) => setError(e.message));
  }, [shareToken]);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="card" style={{ maxWidth: 420, textAlign: "center", boxShadow: "var(--shadow-card)" }}>
          <Compass size={26} style={{ marginBottom: 10, color: "var(--muted)" }} />
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Link not found</h2>
          <p style={{ fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="spin" size={26} color="#fff" />
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const weeks = {};
  for (const t of project.tasks) {
    (weeks[t.week_number] ||= []).push(t);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ background: "var(--gradient)", padding: "40px 24px 100px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", color: "#fff" }}>
          <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 10, fontWeight: 600 }}>Progress tracker · from {project.owner_name}</p>
          <h1 style={{ fontSize: 30, color: "#fff", marginBottom: 8 }}>{project.title}</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14.5 }}>{TYPE_LABELS[project.project_type]} · {project.duration_weeks} week{project.duration_weeks > 1 ? "s" : ""}</p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "-64px auto 0", padding: "0 24px 64px" }}>
        <div className="card" style={{ boxShadow: "var(--shadow-card)", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
            <span className={`badge badge-${project.status}`}>{STATUS_LABELS[project.status]}</span>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>{project.progress_percent}% complete</p>
          </div>
          <div className="progress-track" style={{ marginBottom: 18 }}>
            <div className="progress-fill" style={{ width: `${project.progress_percent}%`, background: "var(--accent-purple)" }} />
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>{project.description}</p>
        </div>

        <div className="card" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 style={{ fontSize: 16, marginBottom: 18 }}>Weekly progress</h3>
          {Object.keys(weeks).sort((a, b) => a - b).map((wk) => (
            <div key={wk} style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--grad-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Week {wk}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {weeks[wk].map((task, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 4px" }}>
                    {task.status === "done" ? (
                      <CheckCircle2 size={19} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: 1 }} />
                    ) : (
                      <Circle size={19} color="var(--border)" style={{ flexShrink: 0, marginTop: 1 }} />
                    )}
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14.5, color: task.status === "done" ? "var(--muted)" : "var(--ink)" }}>{task.title}</p>
                      {task.description && <p style={{ fontSize: 13, marginTop: 2 }}>{task.description}</p>}
                      {task.evidence_url && (
                        <a href={task.evidence_url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--accent-blue)", marginTop: 4, fontWeight: 600 }}>
                          <ExternalLink size={12} /> View proof
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--muted)", marginTop: 24 }}>
          Powered by ClientTrack
        </p>
      </div>
    </div>
  );
}
