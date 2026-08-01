import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Copy, Check, RefreshCw, ExternalLink } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { api } from "../api/client.js";

const STATUS_OPTIONS = ["not_started", "in_progress", "completed", "on_hold"];
const STATUS_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  on_hold: "On hold",
};

function trackerUrl(shareToken) {
  const base = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
  return `${base}/track/${shareToken}`;
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function load() {
    api.getProject(projectId).then(setProject).catch((e) => setError(e.message));
  }

  useEffect(load, [projectId]);

  async function handleStatusChange(status) {
    const updated = await api.updateProjectStatus(projectId, status);
    setProject(updated);
  }

  async function handleTaskToggle(task) {
    const nextStatus = task.status === "done" ? "pending" : "done";
    const updatedTask = await api.updateTaskStatus(projectId, task.id, nextStatus);
    setProject((p) => ({
      ...p,
      tasks: p.tasks.map((t) => (t.id === task.id ? updatedTask : t)),
    }));
  }

  async function handleEvidenceSave(task, url) {
    const updatedTask = await api.updateTaskStatus(projectId, task.id, task.status, url);
    setProject((p) => ({
      ...p,
      tasks: p.tasks.map((t) => (t.id === task.id ? updatedTask : t)),
    }));
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(trackerUrl(project.share_token));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleRotateLink() {
    if (!window.confirm("This invalidates the current tracking link — anyone using the old one will lose access. Continue?")) return;
    const updated = await api.rotateShareLink(projectId);
    setProject(updated);
  }

  if (error) {
    return <AppShell title="Project"><p style={{ color: "var(--accent-coral)" }}>{error}</p></AppShell>;
  }
  if (!project) {
    return <AppShell title="Loading…">{null}</AppShell>;
  }

  const done = project.tasks.filter((t) => t.status === "done").length;
  const progress = project.tasks.length ? Math.round((done / project.tasks.length) * 100) : 0;

  const weeks = {};
  for (const t of project.tasks) {
    (weeks[t.week_number] ||= []).push(t);
  }

  return (
    <AppShell eyebrow={project.client_name} title={project.title}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }} className="detail-grid">
        <div className="card" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 style={{ fontSize: 17, marginBottom: 16 }}>Weekly plan</h3>
          {Object.keys(weeks).sort((a, b) => a - b).map((wk) => (
            <div key={wk} style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--grad-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Week {wk}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {weeks[wk].map((task) => (
                  <label
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      background: task.status === "done" ? "#f7f9ff" : "#fff",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.status === "done"}
                      onChange={() => handleTaskToggle(task)}
                      style={{ marginTop: 3, width: 17, height: 17, accentColor: "var(--accent-purple)" }}
                    />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14.5, textDecoration: task.status === "done" ? "line-through" : "none", color: task.status === "done" ? "var(--muted)" : "var(--ink)" }}>
                        {task.title}
                      </p>
                      {task.description && <p style={{ fontSize: 13, marginTop: 2 }}>{task.description}</p>}
                    </div>
                    <EvidenceInput task={task} onSave={handleEvidenceSave} />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card" style={{ boxShadow: "var(--shadow-card)" }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Progress</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, marginBottom: 10 }}>{progress}%</p>
            <div className="progress-track" style={{ marginBottom: 16 }}>
              <div className="progress-fill" style={{ width: `${progress}%`, background: "var(--accent-purple)" }} />
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" value={project.status} onChange={(e) => handleStatusChange(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card" style={{ boxShadow: "var(--shadow-card)" }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>Client tracking link</p>
            <p style={{ fontSize: 12.5, wordBreak: "break-all", background: "var(--bg)", padding: "10px 12px", borderRadius: "var(--radius-sm)", marginBottom: 12 }}>
              {trackerUrl(project.share_token)}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-sm" onClick={handleCopyLink}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy link"}
              </button>
              <a className="btn btn-ghost btn-sm" href={trackerUrl(project.share_token)} target="_blank" rel="noreferrer">
                <ExternalLink size={14} /> Preview
              </a>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleRotateLink} style={{ marginTop: 10, width: "100%" }}>
              <RefreshCw size={14} /> Rotate link
            </button>
            <p className="hint" style={{ marginTop: 8 }}>Rotate if this link was shared somewhere it shouldn't have been.</p>
          </div>

          <div className="card" style={{ boxShadow: "var(--shadow-card)" }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>Brief</p>
            <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{project.description}</p>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 860px) {
          .detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
  function EvidenceInput({ task, onSave }) {
  const [url, setUrl] = useState(task.evidence_url || "");
  const [saved, setSaved] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    await onSave(task, url);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div style={{ marginTop: 8, display: "flex", gap: 8 }} onClick={(e) => e.preventDefault()}>
      <input
        type="url"
        placeholder="Paste a link to a photo/video of this done"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ flex: 1, fontSize: 13, padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)" }}
      />
      <button className="btn btn-ghost btn-sm" onClick={handleSave} type="button">
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
}
