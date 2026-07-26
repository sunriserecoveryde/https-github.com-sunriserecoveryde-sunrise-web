// Ripple — Iteration B "Radiance"
// 5 thick, bold rays — fewer but heavier strokes make the sun feel powerful.
// Sun is the largest of the four variants. Ripples dive deeper for drama.
// The wide ±65° outer rays reach well into the blue edge of the frame.

function Mark({ dark }: { dark: boolean }) {
  const orange  = dark ? "#FF6B1A" : "#EA6C00";
  const rayCol  = dark ? "#FF8533" : "#F97316";
  const teal    = dark ? "#14B8A6" : "#0D9488";
  const hLine   = dark ? "rgba(20,184,166,0.50)" : "rgba(13,148,136,0.55)";

  // 5 bold rays — all strokeWidth=4.5, rIn=30, rOut=72
  // cx=50, cy=46
  const rays = [
    // [x1,    y1,    x2,    y2  ]
    [50.0,  16.0,  50.0,  -26.0],  // 0°
    [62.6,  19.4,  83.9,   -0.3],  // +30°
    [37.4,  19.4,  16.1,   -0.3],  // -30°
    [74.6,  31.7, 113.5,   16.1],  // +65°
    [25.4,  31.7, -13.5,   16.1],  // -65°
  ] as const;

  return (
    <svg width="154" height="146" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wide soft aura */}
      <circle cx="50" cy="46" r="44" fill="#FEF08A" opacity={dark ? "0.09" : "0.07"}/>

      {/* Bold rays */}
      {rays.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={rayCol} strokeWidth="4.5" strokeLinecap="round" opacity="0.92"/>
      ))}

      {/* Sun — largest disc, r=30 */}
      <circle cx="50" cy="46" r="30" fill={orange}/>
      <circle cx="50" cy="46" r="20" fill="#FBBF24" opacity="0.80"/>
      <circle cx="50" cy="46" r="11" fill="#FEF9C3" opacity="0.90"/>
      {/* Tiny white hot-spot */}
      <circle cx="50" cy="46" r="4"  fill="#FFFFFF"  opacity="0.55"/>

      {/* Horizon */}
      <line x1="0" y1="54" x2="100" y2="54" stroke={hLine} strokeWidth="1.6" strokeLinecap="round"/>

      {/* Ripple 1 — tight, teal */}
      <path d="M 0,54 Q 50,70 100,54" stroke={teal}    strokeWidth="2.8" fill="none" strokeLinecap="round" opacity="0.88"/>
      <path d="M 8,54 Q 50,67 92,54"  stroke="#FBBF24" strokeWidth="1.0" fill="none" strokeLinecap="round" opacity="0.48"/>
      {/* Ripple 2 — deeper, teal */}
      <path d="M 0,54 Q 50,84 100,54" stroke={teal}    strokeWidth="2.0" fill="none" strokeLinecap="round" opacity="0.50"/>
      {/* Ripple 3 — deep, sky-blue */}
      <path d="M 0,54 Q 50,96 100,54" stroke="#38BDF8" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.42"/>
    </svg>
  );
}

export default function RippleB() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, maxWidth: 480, width: "100%" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Ripple Iteration B — "Radiance"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.10em" }}>5 bold thick rays · largest sun · deep dramatic ripples</div>
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
