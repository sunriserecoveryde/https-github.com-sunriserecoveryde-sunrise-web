// Option 3 — "Lighthouse"
// A lighthouse with an orange lamp and teal tower, five light beams fanning outward,
// and sky-blue water below. The lighthouse is among the most trusted symbols in
// nonprofit fundraising — it signals safety, permanence, and guidance for those in
// darkness — a perfect metaphor for the Foundation's mission.

function Mark({ dark }: { dark: boolean }) {
  const orange   = dark ? "#F97316" : "#EA6C00";
  const teal     = dark ? "#14B8A6" : "#0D9488";
  const tealDark = dark ? "#0D9488" : "#0B7A70";
  const glowFill = dark ? "#FED7AA" : "#FFF7ED";
  const skyBlue  = "#38BDF8";
  const waveOp   = dark ? "0.55" : "0.45";

  return (
    <svg width="110" height="108" viewBox="0 0 84 90" fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* ── LIGHT BEAMS (behind tower so tower is in front) ── */}
      {/* Fan of 5 triangle beams from lamp centre at (42, 20) */}
      {/* Centre beam — straight up */}
      <polygon points="42,20 37,2 47,2"         fill={orange} opacity={dark ? "0.20" : "0.14"}/>
      {/* ±32° beams */}
      <polygon points="42,20 23,6 28,1"          fill={orange} opacity={dark ? "0.15" : "0.10"}/>
      <polygon points="42,20 61,6 56,1"          fill={orange} opacity={dark ? "0.15" : "0.10"}/>
      {/* ±62° beams */}
      <polygon points="42,20 8,14 10,8"          fill={orange} opacity={dark ? "0.09" : "0.06"}/>
      <polygon points="42,20 76,14 74,8"         fill={orange} opacity={dark ? "0.09" : "0.06"}/>

      {/* Gold beam lines over the triangles */}
      <line x1="42" y1="20" x2="42" y2="2"     stroke="#FBBF24" strokeWidth="1"   strokeLinecap="round" opacity={dark ? "0.55" : "0.40"}/>
      <line x1="42" y1="20" x2="25" y2="4"     stroke={orange}  strokeWidth="0.8" strokeLinecap="round" opacity={dark ? "0.38" : "0.28"}/>
      <line x1="42" y1="20" x2="59" y2="4"     stroke={orange}  strokeWidth="0.8" strokeLinecap="round" opacity={dark ? "0.38" : "0.28"}/>
      <line x1="42" y1="20" x2="9"  y2="13"    stroke={orange}  strokeWidth="0.6" strokeLinecap="round" opacity={dark ? "0.22" : "0.16"}/>
      <line x1="42" y1="20" x2="75" y2="13"    stroke={orange}  strokeWidth="0.6" strokeLinecap="round" opacity={dark ? "0.22" : "0.16"}/>

      {/* ── LIGHTHOUSE STRUCTURE ── */}
      {/* Base platform — widest */}
      <rect x="18" y="66" width="48" height="7" rx="2" fill={teal}/>
      {/* Step 2 */}
      <rect x="26" y="59" width="32" height="7" rx="1.5" fill={teal}/>
      {/* Tower body — slightly tapered (wider at base) */}
      <polygon points="33,59 51,59 49,32 35,32" fill={teal}/>
      {/* Tower stripe detail — white band */}
      <rect x="34" y="46" width="16" height="3.5" rx="0.5" fill={dark ? "rgba(248,250,252,0.12)" : "rgba(15,23,42,0.10)"}/>
      <rect x="34" y="38" width="16" height="3.5" rx="0.5" fill={dark ? "rgba(248,250,252,0.08)" : "rgba(15,23,42,0.07)"}/>

      {/* Lamp room housing */}
      <rect x="30" y="26" width="24" height="16" rx="3" fill={tealDark}/>
      {/* Lamp room top rail */}
      <rect x="28" y="24" width="28" height="4"  rx="1.5" fill={tealDark}/>

      {/* Sun/lamp — the heart of the lighthouse */}
      <circle cx="42" cy="34" r="9"  fill={orange}/>
      <circle cx="42" cy="34" r="5"  fill={glowFill} opacity="0.50"/>

      {/* ── WATER / SHORE ── */}
      {/* Sky-blue water waves below the base */}
      <path d="M 4,74  Q 21,78 42,74 Q 63,70 80,74" stroke={skyBlue} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity={waveOp}/>
      <path d="M 4,79  Q 21,83 42,79 Q 63,75 80,79" stroke={skyBlue} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity={dark ? "0.35" : "0.28"}/>
      <path d="M 4,84  Q 42,88 80,84"                stroke={teal}   strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.25"/>

      {/* Gold reflection shimmer in water */}
      <line x1="38" y1="77" x2="46" y2="77" stroke="#FBBF24" strokeWidth="0.8" strokeLinecap="round" opacity={dark ? "0.40" : "0.30"}/>
      <line x1="40" y1="81" x2="44" y2="81" stroke="#FBBF24" strokeWidth="0.6" strokeLinecap="round" opacity={dark ? "0.25" : "0.18"}/>
    </svg>
  );
}

export default function Lighthouse() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, maxWidth: 480, width: "100%" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Option 3 — The Sunrise Foundation</div>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontStyle: "italic", color: "#F8FAFC", marginBottom: 4 }}>"Lighthouse"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.1em" }}>GUIDING LIGHT MARK</div>
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
            A teal lighthouse with an orange lamp and five golden light beams — the oldest and most trusted symbol of safe passage through darkness. Sky-blue water and a gold reflection shimmer complete the full Sunrise brand palette. The lighthouse is a proven performer in institutional fundraising: it signals permanence, dependability, and active guidance — qualities that individual donors, corporate sponsors, and grant committees all respond to.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Institutional Trust","Grant-Ready","Permanence","Full Brand Palette"].map(t => (
              <span key={t} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, color: "#FBBF24", background: "rgba(251,191,36,0.10)", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.05em" }}>{t}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
