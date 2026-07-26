// Option 1 — "Cradle"
// Two open arms in teal embrace a warm orange sunrise.
// The hand/giving motif is the most universally understood charitable symbol —
// it directly triggers the donation impulse and communicates protection, hope, and care.

function Mark({ dark }: { dark: boolean }) {
  const orange  = dark ? "#F97316" : "#EA6C00";
  const teal    = dark ? "#14B8A6" : "#0D9488";
  const armW    = dark ? "3.5"     : "3.5";
  const glowFill = dark ? "#FED7AA" : "#FFF7ED";

  // Sun at (42, 30). rIn=18, rOut=28. 7 rays in upper hemisphere.
  // angles: 0, ±24, ±48, ±70
  const rays: [number, number, number, number, number, number][] = [
    // x1,   y1,    x2,    y2,   sw,   op
    [42,     12,    42,     2,   2.8,  1.00],   // a=0
    [49.8,  13.6,  55.3,   5.0, 2.5,  0.90],   // a=24
    [34.2,  13.6,  28.7,   5.0, 2.5,  0.90],   // a=-24
    [57.4,  18.0,  65.7,  11.4, 2.0,  0.78],   // a=48
    [26.6,  18.0,  18.3,  11.4, 2.0,  0.78],   // a=-48
    [62.9,  24.2,  72.4,  20.2, 1.6,  0.62],   // a=70
    [21.1,  24.2,  11.6,  20.2, 1.6,  0.62],   // a=-70
  ];

  return (
    <svg width="110" height="88" viewBox="0 0 84 76" fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* Left arm — sweeps from lower-left up and inward to cradle the sun */}
      <path d="M 8,64 C 8,48 16,38 28,33" stroke={teal} strokeWidth={armW} fill="none" strokeLinecap="round"/>
      {/* Right arm — mirror */}
      <path d="M 76,64 C 76,48 68,38 56,33" stroke={teal} strokeWidth={armW} fill="none" strokeLinecap="round"/>
      {/* Wrist base — gently curves to connect the two arms */}
      <path d="M 8,64 Q 42,74 76,64" stroke={teal} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.45"/>

      {/* Gold shimmer halo — drawn before sun so sun sits on top */}
      <circle cx="42" cy="30" r="24" fill="none" stroke="#FBBF24" strokeWidth="1" opacity={dark ? "0.22" : "0.18"} strokeDasharray="3 7"/>

      {/* Rays */}
      {rays.map(([x1, y1, x2, y2, sw, op]) => (
        <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={orange} strokeWidth={sw} strokeLinecap="round" opacity={op}/>
      ))}

      {/* Sun disc */}
      <circle cx="42" cy="30" r="18" fill={orange}/>
      {/* Inner warmth glow */}
      <circle cx="42" cy="30" r="10" fill={glowFill} opacity="0.42"/>

      {/* Sky-blue accent dot — a single star/point of light — represents aspiration */}
      <circle cx="64" cy="6" r="1.8" fill="#38BDF8" opacity={dark ? "0.7" : "0.5"}/>
      <circle cx="18" cy="8" r="1.2" fill="#38BDF8" opacity={dark ? "0.5" : "0.35"}/>
    </svg>
  );
}

export default function Cradle() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, maxWidth: 480, width: "100%" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Option 1 — The Sunrise Foundation</div>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontStyle: "italic", color: "#F8FAFC", marginBottom: 4 }}>"Cradle"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.1em" }}>GIVING HANDS MARK</div>
        </div>

        {/* Dark — primary brand context */}
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

        {/* Light — print / letterhead */}
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
            Two teal arms open upward — the universal gesture of giving — embrace an orange sunrise at their heart. The gold shimmer halo and sky-blue accent stars suggest aspiration and possibility. The hand motif is the most emotionally proven symbol in nonprofit fundraising, consistently outperforming abstract marks in donation-conversion research.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Donation-Optimised","Empathetic","Hope-Forward","All Demographics"].map(t => (
              <span key={t} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, color: "#F97316", background: "rgba(249,115,22,0.1)", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.05em" }}>{t}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
