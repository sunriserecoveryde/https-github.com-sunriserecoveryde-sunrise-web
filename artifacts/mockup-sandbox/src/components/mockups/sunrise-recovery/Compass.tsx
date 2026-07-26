// Option 3 — "Compass"
// Precision compass ring with sun at center and rays as navigation spokes.
// "Finding your way" resonates across demographics. The compass bezel reads
// as clinically precise to hospital development staff and payers.

function Mark({ dark }: { dark: boolean }) {
  const teal = dark ? "#14B8A6" : "#0D9488";
  const orange = dark ? "#F97316" : "#EA6C00";
  const ringBg = dark ? "rgba(20,184,166,0.05)" : "rgba(13,148,136,0.04)";

  // Tick marks at 8 compass points (r=25 to r=28)
  const ticks = [
    { angle: 270, major: true  }, // N
    { angle: 315, major: false }, // NE
    { angle: 0,   major: true  }, // E
    { angle: 45,  major: false }, // SE
    { angle: 90,  major: true  }, // S
    { angle: 135, major: false }, // SW
    { angle: 180, major: true  }, // W
    { angle: 225, major: false }, // NW
  ];

  // 5 sun rays — upper hemisphere only (N, NNE, NNW, NE, NW)
  const rays = [
    { angle: 270 }, // N straight up
    { angle: 292.5 }, // NNE
    { angle: 247.5 }, // NNW
    { angle: 315 }, // NE
    { angle: 225 }, // NW
  ];

  const toXY = (cx: number, cy: number, angle: number, r: number) => ({
    x: cx + Math.cos((angle * Math.PI) / 180) * r,
    y: cy + Math.sin((angle * Math.PI) / 180) * r,
  });

  const cx = 34, cy = 34;

  return (
    <svg width="96" height="96" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ring fill */}
      <circle cx={cx} cy={cy} r="28" fill={ringBg}/>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r="28" stroke={teal} strokeWidth="2.5" fill="none"/>

      {/* Subtle crosshair */}
      <line x1="6" y1={cy} x2="62" y2={cy} stroke={teal} strokeWidth="0.5" opacity="0.2"/>
      <line x1={cx} y1="6" x2={cx} y2="62" stroke={teal} strokeWidth="0.5" opacity="0.2"/>

      {/* Tick marks */}
      {ticks.map(({ angle, major }) => {
        const inner = toXY(cx, cy, angle, 22);
        const outer = toXY(cx, cy, angle, 27);
        return <line key={angle} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={teal} strokeWidth={major ? 2 : 1} strokeLinecap="round" opacity={major ? 0.9 : 0.5}/>;
      })}

      {/* "N" marker at top */}
      <text x={cx} y={cy - 28 + 10} textAnchor="middle" fontSize="5" fontFamily="'Outfit',sans-serif" fontWeight="700" fill={teal} opacity="0.7">N</text>

      {/* Sun rays — upper hemisphere */}
      {rays.map(({ angle }) => {
        const inner = toXY(cx, cy, angle, 13);
        const outer = toXY(cx, cy, angle, 21);
        return <line key={angle} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={orange} strokeWidth="1.8" strokeLinecap="round"/>;
      })}

      {/* Sun disc */}
      <circle cx={cx} cy={cy} r="11" fill={orange}/>
      <circle cx={cx} cy={cy} r="6.5" fill={dark ? "#FED7AA" : "#FFF7ED"} opacity="0.45"/>
    </svg>
  );
}

export default function Compass() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, maxWidth: 460, width: "100%" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Option 3 — Sunrise Recovery</div>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontStyle: "italic", color: "#F8FAFC", marginBottom: 4 }}>"Compass"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.1em" }}>NAVIGATION + PRECISION MARK</div>
        </div>

        {/* Dark */}
        <div style={{ background: "#0F172A", borderRadius: 14, padding: "28px 36px", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 18, width: "100%", boxSizing: "border-box" }}>
          <Mark dark={true}/>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, color: "#F97316", letterSpacing: 1, lineHeight: 1.05 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 400, color: "#F8FAFC", letterSpacing: "0.38em", marginTop: 3 }}>RECOVERY</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#14B8A6", letterSpacing: "0.18em", marginTop: 6, textTransform: "uppercase" }}>Finding Your Way Forward</div>
          </div>
        </div>

        {/* White */}
        <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "28px 36px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, width: "100%", boxSizing: "border-box" }}>
          <Mark dark={false}/>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, color: "#EA6C00", letterSpacing: 1, lineHeight: 1.05 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 400, color: "#0F172A", letterSpacing: "0.38em", marginTop: 3 }}>RECOVERY</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#0D9488", letterSpacing: "0.18em", marginTop: 6, textTransform: "uppercase" }}>Finding Your Way Forward</div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "18px 22px", width: "100%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#94A3B8", lineHeight: 1.75, margin: 0 }}>
            The compass conveys precision, direction, and finding one's way — a universal metaphor for recovery that crosses demographics and cultures. The bezel reads as institutional and credible to hospital partners; the warm sun at centre speaks to patients and families.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Universal Appeal","Scales to Icon","Hospital-Grade","All Payer Mix"].map(t => (
              <span key={t} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, color: "#14B8A6", background: "rgba(20,184,166,0.1)", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.05em" }}>{t}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
