// Ripple — Iteration C "Corona"
// 13 slender uniform rays — the densest fan, most solar in feel.
// A gold prestige ring at r=31 gives the mark a crowned, prestigious quality.
// Outer rays reach past the frame boundary, anchoring to both blue edges.

function Mark({ dark }: { dark: boolean }) {
  const orange  = dark ? "#FF6B1A" : "#EA6C00";
  const rayCol  = dark ? "#FF8533" : "#F97316";
  const teal    = dark ? "#14B8A6" : "#0D9488";
  const hLine   = dark ? "rgba(20,184,166,0.50)" : "rgba(13,148,136,0.55)";

  // 13 rays — all identical: strokeWidth=2.0, rIn=24, rOut=62
  // cx=50, cy=44  — angles 0, ±14, ±28, ±42, ±56, ±70, ±84
  const rays = [
    [50.0,  20.0,  50.0, -18.0],  //  0°
    [55.8,  20.8,  64.3, -16.5],  // +14°
    [44.2,  20.8,  35.7, -16.5],  // -14°
    [61.3,  23.2,  77.4, -10.3],  // +28°
    [38.7,  23.2,  22.6, -10.3],  // -28°
    [66.1,  26.8,  89.5,  -1.0],  // +42°
    [33.9,  26.8,  10.5,  -1.0],  // -42°
    [69.9,  31.5,  99.8,  10.5],  // +56°
    [30.1,  31.5,   0.2,  10.5],  // -56°
    [72.3,  37.5, 106.4,  22.4],  // +70°
    [27.7,  37.5,  -6.4,  22.4],  // -70°
    [73.9,  43.4, 109.6,  35.3],  // +84°
    [26.1,  43.4,  -9.6,  35.3],  // -84°
  ] as const;

  return (
    <svg width="150" height="142" viewBox="0 0 100 98" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft aura */}
      <circle cx="50" cy="44" r="36" fill="#FEF08A" opacity={dark ? "0.11" : "0.08"}/>

      {/* Rays — slender, dense */}
      {rays.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={rayCol} strokeWidth="2.0" strokeLinecap="round" opacity="0.93"/>
      ))}

      {/* Gold prestige / corona ring */}
      <circle cx="50" cy="44" r="31" fill="none" stroke="#FBBF24"
        strokeWidth="1.4" opacity={dark ? "0.65" : "0.50"}/>

      {/* Sun disc */}
      <circle cx="50" cy="44" r="24" fill={orange}/>
      <circle cx="50" cy="44" r="15" fill="#FBBF24" opacity="0.80"/>
      <circle cx="50" cy="44" r="8"  fill="#FEF9C3" opacity="0.90"/>

      {/* Horizon */}
      <line x1="0" y1="52" x2="100" y2="52" stroke={hLine} strokeWidth="1.5" strokeLinecap="round"/>

      {/* Ripple 1 — teal, tight */}
      <path d="M 0,52 Q 50,66 100,52" stroke={teal}    strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.88"/>
      <path d="M 8,52 Q 50,63 92,52"  stroke="#FBBF24" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.52"/>
      {/* Ripple 2 — teal, medium */}
      <path d="M 0,52 Q 50,80 100,52" stroke={teal}    strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.52"/>
      {/* Ripple 3 — sky-blue, wide */}
      <path d="M 0,52 Q 50,94 100,52" stroke="#38BDF8" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.44"/>
    </svg>
  );
}

export default function RippleC() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, maxWidth: 480, width: "100%" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Ripple Iteration C — "Corona"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.10em" }}>13 fine rays · gold crown ring · densest solar fan</div>
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
