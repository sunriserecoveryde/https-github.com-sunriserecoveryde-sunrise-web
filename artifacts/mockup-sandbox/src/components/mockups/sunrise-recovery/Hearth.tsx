// Option 2 — "Hearth"
// House silhouette with sunrise emerging from above the roofline.
// Directly represents recovery houses. A cross inside signals clinical programs.
// Broad demographic appeal — patients, families, payers, and hospital partners all read it.

function Mark({ dark }: { dark: boolean }) {
  const teal = dark ? "#14B8A6" : "#0D9488";
  const orange = dark ? "#F97316" : "#EA6C00";
  const houseFill = dark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.95)";
  const crossColor = dark ? "#14B8A6" : "#0D9488";

  return (
    <svg width="96" height="88" viewBox="0 0 68 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sun rays — drawn before house so house covers lower rays */}
      <line x1="34" y1="7"  x2="34" y2="0"   stroke={orange} strokeWidth="2"   strokeLinecap="round"/>
      <line x1="34" y1="7"  x2="26" y2="0.5"  stroke={orange} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="34" y1="7"  x2="42" y2="0.5"  stroke={orange} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="34" y1="7"  x2="20" y2="5"    stroke={orange} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="34" y1="7"  x2="48" y2="5"    stroke={orange} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="34" y1="7"  x2="16" y2="12"   stroke={orange} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <line x1="34" y1="7"  x2="52" y2="12"   stroke={orange} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>

      {/* Sun disc */}
      <circle cx="34" cy="13" r="10" fill={orange}/>
      <circle cx="34" cy="13" r="6"  fill={dark ? "#FED7AA" : "#FFF7ED"} opacity="0.45"/>

      {/* House fill — covers lower sun portion, creating "sun behind roofline" effect */}
      <path d="M10 34 L34 18 L58 34 L58 58 L10 58 Z" fill={houseFill}/>

      {/* House outline */}
      <path d="M10 34 L34 18 L58 34 L58 58 L10 58 Z" stroke={teal} strokeWidth="2.2" fill="none" strokeLinejoin="round"/>

      {/* Subtle medical cross inside the house body */}
      <line x1="34" y1="38" x2="34" y2="52" stroke={crossColor} strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
      <line x1="27" y1="45" x2="41" y2="45" stroke={crossColor} strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

export default function Hearth() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, maxWidth: 460, width: "100%" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Option 2 — Sunrise Recovery</div>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontStyle: "italic", color: "#F8FAFC", marginBottom: 4 }}>"Hearth"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.1em" }}>HOUSE + CLINICAL MARK</div>
        </div>

        {/* Dark */}
        <div style={{ background: "#0F172A", borderRadius: 14, padding: "28px 36px", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 18, width: "100%", boxSizing: "border-box" }}>
          <Mark dark={true}/>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, color: "#F97316", letterSpacing: 1, lineHeight: 1.05 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 400, color: "#F8FAFC", letterSpacing: "0.38em", marginTop: 3 }}>RECOVERY</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#14B8A6", letterSpacing: "0.18em", marginTop: 6, textTransform: "uppercase" }}>Treatment &amp; Recovery Homes</div>
          </div>
        </div>

        {/* White */}
        <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "28px 36px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, width: "100%", boxSizing: "border-box" }}>
          <Mark dark={false}/>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, color: "#EA6C00", letterSpacing: 1, lineHeight: 1.05 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 400, color: "#0F172A", letterSpacing: "0.38em", marginTop: 3 }}>RECOVERY</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#0D9488", letterSpacing: "0.18em", marginTop: 6, textTransform: "uppercase" }}>Treatment &amp; Recovery Homes</div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "18px 22px", width: "100%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#94A3B8", lineHeight: 1.75, margin: 0 }}>
            The sunrise behind the roofline signals hope and a new beginning; the house shape anchors recovery in a real, physical home. The subtle clinical cross inside tells hospitals and payers this is a credentialed program — not just a sober house.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Recovery Houses","Broad Demographics","Family Appeal","Managed Care"].map(t => (
              <span key={t} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, color: "#14B8A6", background: "rgba(20,184,166,0.1)", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.05em" }}>{t}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
