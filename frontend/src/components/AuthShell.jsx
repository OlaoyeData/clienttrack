export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 960, display: "grid", gridTemplateColumns: "1.1fr 1fr", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-card)" }} className="auth-grid">
        <div style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(6px)", padding: "56px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#fff" }} className="auth-side">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fff", display: "grid", placeItems: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--grad-3)" }}>C</span>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>ClientTrack</span>
          </div>
          <div>
            <h1 style={{ fontSize: 32, lineHeight: 1.15, color: "#fff", marginBottom: 14 }}>
              Give every client a live view of their project.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 1.6 }}>
              Set the scope once — ClientTrack lays out the weekly plan for you, and each client gets a link to watch it move.
            </p>
          </div>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>No spreadsheets. No status-update emails.</p>
        </div>
        <div style={{ background: "var(--surface)", padding: "56px 44px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 style={{ fontSize: 24, marginBottom: 6 }}>{title}</h2>
          <p style={{ marginBottom: 28, fontSize: 14.5 }}>{subtitle}</p>
          {children}
          {footer && <div style={{ marginTop: 22, fontSize: 14 }}>{footer}</div>}
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-side { display: none !important; }
        }
      `}</style>
    </div>
  );
}
