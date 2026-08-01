import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { api } from "../api/client.js";

const PROJECT_TYPES = [
  { value: "landing_page", label: "Landing page" },
  { value: "full_website", label: "Full website" },
  { value: "web_app", label: "Web app" },
  { value: "mobile_app", label: "Mobile app" },
  { value: "branding", label: "Branding" },
  { value: "other", label: "Other" },
];

const SHOWS_PAGES = new Set(["landing_page", "full_website", "web_app"]);

export default function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    title: "",
    project_type: "landing_page",
    description: "",
    num_pages: "",
    duration_weeks: "2",
    duration_days: "0",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        client_name: form.client_name,
        client_email: form.client_email || undefined,
        title: form.title,
        project_type: form.project_type,
        description: form.description,
        num_pages: form.num_pages ? Number(form.num_pages) : undefined,
        duration_weeks: Number(form.duration_weeks),
        duration_days: Number(form.duration_days || 0),
      };
      const project = await api.createProject(payload);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell eyebrow="Set the scope once" title="New project">
      <form onSubmit={handleSubmit} className="card" style={{ boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="form-row">
          <div className="field">
            <label htmlFor="client_name">Client name</label>
            <input id="client_name" required value={form.client_name} onChange={(e) => update("client_name", e.target.value)} placeholder="Acme Corp" />
          </div>
          <div className="field">
            <label htmlFor="client_email">Client email <span className="hint">(optional)</span></label>
            <input id="client_email" type="email" value={form.client_email} onChange={(e) => update("client_email", e.target.value)} placeholder="hello@acme.com" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="title">Project title</label>
          <input id="title" required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Acme product launch page" />
        </div>

        <div className="field">
          <label htmlFor="project_type">Project type</label>
          <select id="project_type" value={form.project_type} onChange={(e) => update("project_type", e.target.value)}>
            {PROJECT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="description">What are you building?</label>
          <textarea
            id="description"
            required
            minLength={10}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="e.g. A landing page to promote our new product launch, with an email signup form and pricing section."
          />
          <span className="hint">This is what the planner uses to draft the weekly breakdown — the more specific, the better.</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: SHOWS_PAGES.has(form.project_type) ? "1fr 1fr 1fr" : "1fr 1fr", gap: 16 }} className="form-row">
          {SHOWS_PAGES.has(form.project_type) && (
            <div className="field">
              <label htmlFor="num_pages">Number of pages</label>
              <input id="num_pages" type="number" min="1" value={form.num_pages} onChange={(e) => update("num_pages", e.target.value)} placeholder="5" />
            </div>
          )}
          <div className="field">
            <label htmlFor="duration_weeks">Weeks</label>
            <input id="duration_weeks" type="number" min="1" max="104" required value={form.duration_weeks} onChange={(e) => update("duration_weeks", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="duration_days">Extra days</label>
            <input id="duration_days" type="number" min="0" max="6" value={form.duration_days} onChange={(e) => update("duration_days", e.target.value)} />
          </div>
        </div>

        {error && <p style={{ color: "var(--accent-coral)", fontSize: 13.5 }}>{error}</p>}

        <button className="btn btn-gradient" type="submit" disabled={loading} style={{ alignSelf: "flex-start" }}>
          <Sparkles size={16} /> {loading ? "Generating weekly plan…" : "Create project & generate plan"}
        </button>
      </form>
      <style>{`
        @media (max-width: 560px) {
          .form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
