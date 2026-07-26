// Ripple — Iteration D "Solstice"
// 7 rays at even 25° spacing — the balanced middle ground.
// Four-layer ripple (gold → teal → teal → sky-blue) creates the richest
// sense of depth. Sun has a distinct white hot-core for maximum brightness.
// Outermost ±75° rays reach both blue-tinted far edges of the frame.

function Mark({ dark }: { dark: boolean }) {
  const orange  = dark ? "#FF6B1A" : "#EA6C00";
  const rayCol  = dark ? "#FF8533" : "#F97316";
  const teal    = dark ? "#14B8A6" : "#0D9488";
  const hLine   = dark ? "rgba(20,184,166,0.50)" : "rgba(13,148,136,0.55)";

  // 7 rays — all identical: strokeWidth=3.0, rIn=28, rOut=68
  // cx=50, cy=44  — angles 0, ±25, ±50, ±75
  const rays = [
    [50.0,  16.0,  50.0,  -24.0],  //  0°
    [61.8,  19.1,  78.7,    2.3],  // +25°
    [38.2,  19.1,  21.3,    2.3],  // -25°
    [71.4,  26.1, 102.1,   -2.5],  // +50°
    [28.6,  26.1,  -2.1,   -2.5],  // -50°
    [75.7,  36.8, 115.6,   26.2],  // +75°
    [24.3,  36.8, -15.6,   26.2],  // -75°
  ] as const;

  return (
    <svg width="152" height="148" viewBox="0 0 100 102" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft aura */}
      <circle cx="50" cy="44" r="42" fill="#FEF08A" opacity={dark ? "0.10" : "0.07"}/>

      {/* Rays */}
      {rays.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={rayCol} strokeWidth="3.0" strokeLinecap="round" opacity="0.94"/>
      ))}

      {/* Sun disc — four layers for max brightness gradient */}
      <circle cx="50" cy="44" r="28" fill={orange}/>
      <circle cx="50" cy="44" r="19" fill="#FBBF24" opacity="0.82"/>
      <circle cx="50" cy="44" r="11" fill="#FEF9C3" opacity="0.90"/>
      {/* White hot-core */}
      <circle cx="50" cy="44" r="5"  fill="#FFFFFF"  opacity="0.70"/>

      {/* Horizon */}
      <line x1="0" y1="53" x2="100" y2="53" stroke={hLine} strokeWidth="1.5" strokeLinecap="round"/>

      {/* Ripple 1 — gold shimmer closest to sun */}
      <path d="M 0,53 Q 50,65 100,53" stroke="#FBBF24" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.62"/>
      {/* Ripple 2 — teal main, tight-medium */}
      <path d="M 0,53 Q 50,74 100,53" stroke={teal}    strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85"/>
      {/* Ripple 3 — teal, medium-wide */}
      <path d="M 0,53 Q 50,85 100,53" stroke={teal}    strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.50"/>
      {/* Ripple 4 — sky-blue, widest — "blue edge to blue edge" */}
      <path d="M 0,53 Q 50,99 100,53" stroke="#38BDF8" strokeWidth="1.0" fill="none" strokeLinecap="round" opacity="0.42"/>
    </svg>
  );
}

export default function RippleD() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, maxWidth: 480, width: "100%" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Ripple Iteration D — "Solstice"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.10em" }}>7 medium rays · 4-layer ripple · white hot-core sun</div>
        </div>

        {/* Dark */}
        <div style={{ background: "#0F172A", borderRadius: 14, padding: "30px 40px", border: "1px solid rgba(255,255,255,0.07)", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Mark dark={true}/>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 13, fontWeight: 600, fontStyle: "italic", color: "#F97316", letterSpacing: "0.18em", lineHeight: 1 }}>THE SUNRISE</div>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 32, fontWeight: 700, color: "#F8FAFC", letterSpacing: "3px", lineHeight: 1.05, marginTop: 2 }}>FOUNDATION</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#14B8A6", letterSpacing: "0.22em", marginTop: 8, textTransform: "uppercase" }}>Funding Recovery &bull; Restoring Hope</div>
            </div>
          </div>
        </div>

        {/* Light */}
        <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "30px 40px", border: "1px solid #E2E8F0", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Mark dark={false}/>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 13, fontWeight: 600, fontStyle: "italic", color: "#EA6C00", letterSpacing: "0.18em", lineHeight: 1 }}>THE SUNRISE</div>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: "3px", lineHeight: 1.05, marginTop: 2 }}>FOUNDATION</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#0D9488", letterSpacing: "0.22em", marginTop: 8, textTransform: "uppercase" }}>Funding Recovery &bull; Restoring Hope</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
