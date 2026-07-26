// Option 5 — "Grove"
// A stylized tree where the canopy IS a sunrise — branches and rays are the
// same element. The trunk grounds it in community and place (recovery houses).
// The dual sunrise/tree reading crosses all demographics and cultures.

function Mark({ dark }: { dark: boolean }) {
  const orange = dark ? "#F97316" : "#EA6C00";
  const teal   = dark ? "#14B8A6" : "#0D9488";

  // Sun / tree convergence point: (34, 40)
  // Trunk: rect from y=40 to y=62
  // Branch-rays from (34, 40):
  const cx = 34, cy = 40;
  const branches = [
    { angle: 270, r: 30, w: 2.2 },    // straight up (leader)
    { angle: 300, r: 25, w: 2.2 },    // upper-right 30°
    { angle: 240, r: 25, w: 2.2 },    // upper-left 30°
    { angle: 330, r: 20, w: 1.8 },    // upper-right 60°
    { angle: 210, r: 20, w: 1.8 },    // upper-left 60°
    { angle: 355, r: 16, w: 1.4 },    // almost horizontal right
    { angle: 185, r: 16, w: 1.4 },    // almost horizontal left
  ];

  return (
    <svg width="96" height="96" viewBox="0 0 68 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Branch-rays from sun centre */}
      {branches.map(({ angle, r, w }) => {
        const rad = (angle * Math.PI) / 180;
        const x2 = cx + Math.cos(rad) * r;
        const y2 = cy + Math.sin(rad) * r;
        return (
          <line key={angle}
            x1={cx} y1={cy}
            x2={x2} y2={y2}
            stroke={orange} strokeWidth={w} strokeLinecap="round"
          />
        );
      })}

      {/* Sun disc at branch convergence */}
      <circle cx={cx} cy={cy} r="9" fill={orange}/>
      <circle cx={cx} cy={cy} r="5.5" fill={dark ? "#FED7AA" : "#FFF7ED"} opacity="0.5"/>

      {/* Trunk */}
      <rect x="30" y="40" width="8" height="24" rx="2" fill={teal}/>

      {/* Root spread */}
      <path d="M30 62 Q24 64 18 62" stroke={teal} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M38 62 Q44 64 50 62" stroke={teal} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <line x1="34" y1="64" x2="34" y2="67" stroke={teal} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function Grove() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, maxWidth: 460, width: "100%" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Option 5 — Sunrise Recovery</div>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontStyle: "italic", color: "#F8FAFC", marginBottom: 4 }}>"Grove"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.1em" }}>TREE + SUNRISE DUAL MARK</div>
        </div>

        {/* Dark */}
        <div style={{ background: "#0F172A", borderRadius: 14, padding: "28px 36px", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 18, width: "100%", boxSizing: "border-box" }}>
          <Mark dark={true}/>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, color: "#F97316", letterSpacing: 1, lineHeight: 1.05 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 400, color: "#F8FAFC", letterSpacing: "0.38em", marginTop: 3 }}>RECOVERY</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#14B8A6", letterSpacing: "0.18em", marginTop: 6, textTransform: "uppercase" }}>Rooted in Community</div>
          </div>
        </div>

        {/* White */}
        <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "28px 36px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, width: "100%", boxSizing: "border-box" }}>
          <Mark dark={false}/>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, color: "#EA6C00", letterSpacing: 1, lineHeight: 1.05 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 400, color: "#0F172A", letterSpacing: "0.38em", marginTop: 3 }}>RECOVERY</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, color: "#0D9488", letterSpacing: "0.18em", marginTop: 6, textTransform: "uppercase" }}>Rooted in Community</div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "18px 22px", width: "100%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#94A3B8", lineHeight: 1.75, margin: 0 }}>
            The canopy IS the sunrise — branches and rays are the same element. The teal trunk grounds recovery in community and place, while the roots reinforce stability and belonging. The dual tree/sunrise reading works across all cultures and demographics with no language required.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Community Housing","Cultural Crossover","Diverse Demographics","Memorable Mark"].map(t => (
              <span key={t} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, color: "#14B8A6", background: "rgba(20,184,166,0.1)", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.05em" }}>{t}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
