// Option 4 — "Horizon"
// Wide panoramic sunrise — the breadth signals a broad demographic reach and
// wide payer mix. The expansive horizontal format is unusual in healthcare logos,
// which makes it highly distinctive and SEO-memorable.

function Mark({ dark }: { dark: boolean }) {
  const orange = dark ? "#F97316" : "#EA6C00";
  const teal   = dark ? "#14B8A6" : "#0D9488";
  const horizonColor = dark ? "rgba(20,184,166,0.7)" : "rgba(13,148,136,0.8)";

  // 9 rays from sun (cx=52, cy=34), upper hemisphere
  // angles from vertical: 0, ±20, ±40, ±62, ±80 degrees
  const angles = [0, 20, -20, 40, -40, 62, -62, 80, -80];
  const rIn = 18, rOut = 32;

  return (
    <svg width="120" height="72" viewBox="0 0 88 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wide horizon line */}
      <line x1="0" y1="34" x2="88" y2="34" stroke={horizonColor} strokeWidth="1.5" strokeLinecap="round"/>

      {/* Rays — upper hemisphere */}
      {angles.map((a) => {
        const rad = (a * Math.PI) / 180;
        const dx = Math.sin(rad), dy = -Math.cos(rad);
        return (
          <line
            key={a}
            x1={44 + dx * rIn} y1={34 + dy * rIn}
            x2={44 + dx * rOut} y2={34 + dy * rOut}
            stroke={orange}
            strokeWidth={Math.abs(a) < 25 ? 2 : Math.abs(a) < 55 ? 1.8 : 1.4}
            strokeLinecap="round"
            opacity={1 - Math.abs(a) * 0.004}
          />
        );
      })}

      {/* Sun disc — sitting on horizon */}
      <circle cx="44" cy="34" r="15" fill={orange}/>
      {/* Glow */}
      <circle cx="44" cy="34" r="9" fill={dark ? "#FED7AA" : "#FFF7ED"} opacity="0.45"/>

      {/* Reflected shimmer below horizon — 3 short lines */}
      <line x1="38" y1="38" x2="50" y2="38" stroke={orange} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <line x1="40" y1="42" x2="48" y2="42" stroke={orange} strokeWidth="0.8" strokeLinecap="round" opacity="0.25"/>
      <line x1="42" y1="46" x2="46" y2="46" stroke={orange} strokeWidth="0.6" strokeLinecap="round" opacity="0.15"/>
    </svg>
  );
}

export default function Horizon() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, maxWidth: 460, width: "100%" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>Option 4 — Sunrise Recovery</div>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontStyle: "italic", color: "#F8FAFC", marginBottom: 4 }}>"Horizon"</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: "#475569", letterSpacing: "0.1em" }}>PANORAMIC REACH MARK</div>
        </div>

        {/* Dark — stacked layout (mark above wordmark) */}
        <div style={{ background: "#0F172A", borderRadius: 14, padding: "28px 36px", border: "1px solid rgba(255,255,255,0.07)", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Mark dark={true}/>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 700, color: "#F97316", letterSpacing: 2, lineHeight: 1.0 }}>SUNRISE RECOVERY</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9.5, fontWeight: 500, color: "#14B8A6", letterSpacing: "0.2em", marginTop: 6, textTransform: "uppercase" }}>Treatment Programs &amp; Recovery Residences</div>
            </div>
          </div>
        </div>

        {/* White */}
        <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "28px 36px", border: "1px solid #E2E8F0", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Mark dark={false}/>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 700, color: "#EA6C00", letterSpacing: 2, lineHeight: 1.0 }}>SUNRISE RECOVERY</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9.5, fontWeight: 500, color: "#0D9488", letterSpacing: "0.2em", marginTop: 6, textTransform: "uppercase" }}>Treatment Programs &amp; Recovery Residences</div>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "18px 22px", width: "100%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#94A3B8", lineHeight: 1.75, margin: 0 }}>
            The wide panoramic sunrise signals broad reach and open access — reinforcing the message that Sunrise Recovery serves a full demographic spectrum. The reflected shimmer beneath the horizon suggests depth of care. Best SEO visual footprint of the five options due to its distinctive wide-format silhouette.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["SEO Distinctive","Digital-First","Broad Demographic","Open Access"].map(t => (
              <span key={t} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, color: "#14B8A6", background: "rgba(20,184,166,0.1)", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.05em" }}>{t}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
