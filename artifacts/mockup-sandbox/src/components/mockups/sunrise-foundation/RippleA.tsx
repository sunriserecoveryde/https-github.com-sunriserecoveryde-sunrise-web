// Ripple — Iteration A "Solar"
// 9 uniform rays fanning from ±80°, all identical weight.
// Rays are long enough to clip at the canvas edges — the outermost pair
// literally touch the blue of the outermost ripple arc.
// Sun: outer orange → gold mid → bright pale-yellow centre.

function Mark({ dark }: { dark: boolean }) {
  const orange  = dark ? "#FF6B1A" : "#EA6C00";
  const rayCol  = dark ? "#FF8533" : "#F97316";
  const teal    = dark ? "#14B8A6" : "#0D9488";
  const hLine   = dark ? "rgba(20,184,166,0.50)" : "rgba(13,148,136,0.55)";

  // 9 rays — all identical: strokeWidth=2.5, rIn=26, rOut=66
  // cx=50, cy=44  — angles from vertical (+ = right)
  const rays = [
    // [x1,    y1,    x2,    y2  ]
    [50.0,  18.0,  50.0,  -22.0],  // 0°
    [58.9,  19.6,  74.5,  -17.6],  // +22°
    [41.1,  19.6,  25.5,  -17.6],  // -22°
    [66.8,  24.6,  93.7,   -2.7],  // +44°
    [33.2,  24.6,   6.3,   -2.7],  // -44°
    [73.0,  31.5, 109.7,   13.5],  // +66°
    [27.0,  31.5,  -9.7,   13.5],  // -66°
    [75.5,  40.2, 117.0,   32.6],  // +80°
    [24.5,  40.2, -17.0,   32.6],  // -80°
  ] as const;

  return (
    <svg width="150" height="140" viewBox="0 0 100 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft yellow aura — warmth halo behind everything */}
      <circle cx="50" cy="44" r="38" fill="#FEF08A" opacity={dark ? "0.10" : "0.08"}/>

      {/* Rays — drawn before disc so disc covers their inner ends cleanly */}
      {rays.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={rayCol} strokeWidth="2.5" strokeLinecap="round" opacity="0.95"/>
      ))}

      {/* Sun disc — outer orange */}
      <circle cx="50" cy="44" r="26" fill={orange}/>
      {/* Gold / amber mid-layer */}
      <circle cx="50" cy="44" r="17" fill="#FBBF24" opacity="0.82"/>
      {/* Bright pale-yellow centre */}
      <circle cx="50" cy="44" r="9"  fill="#FEF9C3" opacity="0.88"/>

      {/* Horizon line */}
      <line x1="0" y1="52" x2="100" y2="52" stroke={hLine} strokeWidth="1.5" strokeLinecap="round"/>

      {/* Ripple 1 — tight, teal — spans full width */}
      <path d="M 0,52 Q 50,65 100,52" stroke={teal}     strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.88"/>
      {/* Ripple 1 gold shimmer overlay */}
      <path d="M 10,52 Q 50,62 90,52" stroke="#FBBF24"  strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.50"/>
      {/* Ripple 2 — medium, teal */}
      <path d="M 0,52 Q 50,78 100,52" stroke={teal}     strokeWidth="1.7" fill="none" strokeLinecap="round" opacity="0.55"/>
      {/* Ripple 3 — wide, sky-blue — the "blue edges" */}
      <path d="M 0,52 Q 50,92 100,52" stroke="#38BDF8"  strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.45"/>
    </svg>
  );
}

export default function RippleA() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, maxWidth: 480, width: "100%" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Ripple Iteration A — "Solar"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.10em" }}>9 uniform rays · orange→yellow sun · 3 full-width ripples</div>
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
