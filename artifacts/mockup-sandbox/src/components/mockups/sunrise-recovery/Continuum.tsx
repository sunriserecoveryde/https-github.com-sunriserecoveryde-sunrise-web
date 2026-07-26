// Option 1 — "Continuum"
// Rising arc with 3 care-pathway nodes leads to a sun at the apex.
// Speaks directly to hospital development staff who think in care continuum.
// The ascending path = detox → residential → PHP → IOP → recovery house.

function Mark({ dark }: { dark: boolean }) {
  const teal = dark ? "#14B8A6" : "#0D9488";
  const orange = dark ? "#F97316" : "#EA6C00";
  const nodeFill = dark ? "#0F172A" : "#FFFFFF";

  // Arc: M 6 56 C 22 56 50 12 62 12
  // Node positions on bezier (approximate t=0.28, 0.55, 0.78):
  const nodes = [
    { cx: 24, cy: 46, label: "Residential" },
    { cx: 38, cy: 32, label: "PHP / IOP" },
    { cx: 52, cy: 20, label: "Recovery House" },
  ];

  return (
    <svg width="96" height="84" viewBox="0 0 68 62" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dashed arc track (background) */}
      <path d="M 6 56 C 22 56 50 12 62 12" stroke={teal} strokeWidth="1" strokeDasharray="2 3" opacity="0.35" fill="none" strokeLinecap="round"/>
      {/* Solid arc pathway */}
      <path d="M 6 56 C 22 56 50 12 62 12" stroke={teal} strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* Start node */}
      <circle cx="6" cy="56" r="4" fill={teal} opacity="0.6"/>

      {/* Milestone nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.cx} cy={n.cy} r="5.5" fill={teal}/>
          <circle cx={n.cx} cy={n.cy} r="3" fill={nodeFill}/>
        </g>
      ))}

      {/* Sun at apex */}
      {/* Rays from (62,12) — upper-left hemisphere */}
      <line x1="62" y1="12" x2="48" y2="12" stroke={orange} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="62" y1="12" x2="53.5" y2="2.5" stroke={orange} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="62" y1="12" x2="62" y2="0" stroke={orange} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="62" y1="12" x2="53" y2="21" stroke={orange} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <circle cx="62" cy="12" r="9" fill={orange}/>
      <circle cx="62" cy="12" r="5.5" fill={dark ? "#FED7AA" : "#FFF7ED"} opacity="0.4"/>
    </svg>
  );
}

export default function Continuum() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, maxWidth: 460, width: "100%" }}>

        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Option 1 — Sunrise Recovery</div>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontStyle: "italic", color: "#F8FAFC", marginBottom: 4 }}>"Continuum"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.1em" }}>THE CARE PATHWAY MARK</div>
        </div>

        {/* Dark version */}
        <div style={{ background: "#0F172A", borderRadius: 14, padding: "28px 36px", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 18, width: "100%", boxSizing: "border-box" }}>
          <Mark dark={true}/>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, color: "#F97316", letterSpacing: 1, lineHeight: 1.05 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 400, color: "#F8FAFC", letterSpacing: "0.38em", marginTop: 3 }}>RECOVERY</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#14B8A6", letterSpacing: "0.18em", marginTop: 6, textTransform: "uppercase" }}>Treatment &amp; Recovery Programs</div>
          </div>
        </div>

        {/* White version */}
        <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "28px 36px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, width: "100%", boxSizing: "border-box" }}>
          <Mark dark={false}/>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, color: "#EA6C00", letterSpacing: 1, lineHeight: 1.05 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 400, color: "#0F172A", letterSpacing: "0.38em", marginTop: 3 }}>RECOVERY</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#0D9488", letterSpacing: "0.18em", marginTop: 6, textTransform: "uppercase" }}>Treatment &amp; Recovery Programs</div>
          </div>
        </div>

        {/* Description */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "18px 22px", width: "100%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#94A3B8", lineHeight: 1.75, margin: 0 }}>
            The arc represents the clinical continuum — detox through residential, PHP/IOP, and into a recovery house. The milestone nodes give referring clinicians and development staff an immediate visual shorthand for structured, stepped care.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Hospital Referrals","Payer Relations","Clinical Credibility","Government Contracts"].map(t => (
              <span key={t} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, color: "#14B8A6", background: "rgba(20,184,166,0.1)", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.05em" }}>{t}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
