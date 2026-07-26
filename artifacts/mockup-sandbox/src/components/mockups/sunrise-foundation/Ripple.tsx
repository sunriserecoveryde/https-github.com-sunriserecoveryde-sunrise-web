// Option 2 — "Ripple"
// A single sunrise on the horizon, radiating outward through concentric teal ripple waves.
// Communicates: one gift creates impact that spreads far beyond the initial act.
// Highly SEO-distinctive silhouette — the ring/ripple form is instantly recognisable
// at favicon scale and stands apart from every other healthcare nonprofit mark.

function Mark({ dark }: { dark: boolean }) {
  const orange   = dark ? "#F97316" : "#EA6C00";
  const teal     = dark ? "#14B8A6" : "#0D9488";
  const skyBlue  = "#38BDF8";
  const glowFill = dark ? "#FED7AA" : "#FFF7ED";
  const hLine    = dark ? "rgba(20,184,166,0.45)" : "rgba(13,148,136,0.5)";

  // Sun at (44, 38). 7 rays upper hemisphere. rIn=13, rOut=25.
  // Angles from vertical: 0, ±24, ±48, ±70
  const rays: [number, number, number, number, number, number][] = [
    [44,    25,   44,   13,  2.8, 1.00],   // a=0
    [49.3,  26.2, 53.6, 16.2, 2.5, 0.90], // a=24
    [38.7,  26.2, 34.4, 16.2, 2.5, 0.90], // a=-24
    [53.7,  29.4, 60.6, 19.4, 2.0, 0.78], // a=48
    [34.3,  29.4, 27.4, 19.4, 2.0, 0.78], // a=-48
    [56.2,  33.6, 63.6, 29.2, 1.6, 0.62], // a=70
    [31.8,  33.6, 24.4, 29.2, 1.6, 0.62], // a=-70
  ];

  return (
    <svg width="116" height="92" viewBox="0 0 88 80" fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* Gold prestige ring around sun — rendered first so sun covers the centre */}
      <circle cx="44" cy="38" r="18" fill="none" stroke="#FBBF24" strokeWidth="0.9"
        opacity={dark ? "0.38" : "0.28"}/>

      {/* Horizon line — full width */}
      <line x1="4" y1="44" x2="84" y2="44" stroke={hLine} strokeWidth="1.5" strokeLinecap="round"/>

      {/* Ripple arcs below horizon — teal concentric waves */}
      {/* Ripple 1 — tight */}
      <path d="M 30,44 Q 44,56 58,44" stroke={teal}    strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.80"/>
      {/* Ripple 2 */}
      <path d="M 18,44 Q 44,64 70,44" stroke={teal}    strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.52"/>
      {/* Ripple 3 — wide */}
      <path d="M 4,44  Q 44,74 84,44" stroke={teal}    strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.28"/>

      {/* Gold shimmer on innermost ripple */}
      <path d="M 34,44 Q 44,53 54,44" stroke="#FBBF24" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.45"/>
      {/* Sky-blue shimmer on outermost ripple — aspiration at the edge of reach */}
      <path d="M 4,44  Q 44,72 84,44" stroke={skyBlue} strokeWidth="0.6" fill="none" strokeLinecap="round" opacity={dark ? "0.25" : "0.18"}/>

      {/* Rays */}
      {rays.map(([x1, y1, x2, y2, sw, op]) => (
        <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={orange} strokeWidth={sw} strokeLinecap="round" opacity={op}/>
      ))}

      {/* Sun disc — sits on horizon */}
      <circle cx="44" cy="38" r="13" fill={orange}/>
      {/* Inner warmth glow */}
      <circle cx="44" cy="38" r="7" fill={glowFill} opacity="0.44"/>
    </svg>
  );
}

export default function Ripple() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, maxWidth: 480, width: "100%" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Option 2 — The Sunrise Foundation</div>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontStyle: "italic", color: "#F8FAFC", marginBottom: 4 }}>"Ripple"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.1em" }}>IMPACT WAVE MARK</div>
        </div>

        {/* Dark */}
        <div style={{ background: "#0F172A", borderRadius: 14, padding: "32px 44px", border: "1px solid rgba(255,255,255,0.07)", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Mark dark={true}/>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 13, fontWeight: 600, fontStyle: "italic", color: "#F97316", letterSpacing: "0.18em", lineHeight: 1 }}>THE SUNRISE</div>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 32, fontWeight: 700, color: "#F8FAFC", letterSpacing: "3px", lineHeight: 1.05, marginTop: 2 }}>FOUNDATION</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#14B8A6", letterSpacing: "0.22em", marginTop: 8, textTransform: "uppercase" }}>Funding Recovery &bull; Restoring Hope</div>
            </div>
          </div>
        </div>

        {/* Light */}
        <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "32px 44px", border: "1px solid #E2E8F0", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Mark dark={false}/>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 13, fontWeight: 600, fontStyle: "italic", color: "#EA6C00", letterSpacing: "0.18em", lineHeight: 1 }}>THE SUNRISE</div>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: "3px", lineHeight: 1.05, marginTop: 2 }}>FOUNDATION</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#0D9488", letterSpacing: "0.22em", marginTop: 8, textTransform: "uppercase" }}>Funding Recovery &bull; Restoring Hope</div>
            </div>
          </div>
        </div>

        {/* Descriptor */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "18px 22px", width: "100%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#94A3B8", lineHeight: 1.8, margin: 0 }}>
            A sunrise on the horizon sends three concentric teal ripple waves outward — each ring representing another life, family, or community touched by a donor's gift. The gold prestige ring and sky-blue outermost ripple weave together every color in the Sunrise family. The circular silhouette is SEO-optimal: unique in the healthcare nonprofit space and immediately recognisable at favicon and social-avatar size.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["SEO-Distinctive","Social-Ready","Donor-Story","Full Brand Palette"].map(t => (
              <span key={t} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, color: "#14B8A6", background: "rgba(20,184,166,0.1)", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.05em" }}>{t}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
