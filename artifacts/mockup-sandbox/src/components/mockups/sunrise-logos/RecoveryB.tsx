export default function RecoveryB() {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>

        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>
            Option B — Sunrise Recovery
          </div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#64748B" }}>
            "Renewal"
          </div>
        </div>

        {/* Dark */}
        <div style={{ background: "#0F172A", borderRadius: 16, padding: "36px 48px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="82" viewBox="0 0 68 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 62 Q18 46 34 50 Q50 46 66 62 L66 70 L2 70 Z" fill="#166534" opacity="0.85"/>
            <path d="M34 50 Q30 44 33 38 Q37 44 34 50 Z" fill="#16A34A"/>
            <line x1="34" y1="50" x2="34" y2="38" stroke="#16A34A" strokeWidth="1" strokeLinecap="round"/>
            <circle cx="34" cy="28" r="18" fill="#F59E0B"/>
            {rays.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return <line key={deg} x1={34 + Math.cos(rad) * 21} y1={28 + Math.sin(rad) * 21} x2={34 + Math.cos(rad) * 27} y2={28 + Math.sin(rad) * 27} stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>;
            })}
            <circle cx="34" cy="28" r="12" fill="#FDE68A" opacity="0.35"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#F59E0B", letterSpacing: 1, lineHeight: 1.1 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 400, color: "#F8FAFC", letterSpacing: "0.35em", lineHeight: 1.8 }}>RECOVERY</div>
          </div>
        </div>

        {/* White */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "36px 48px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="82" viewBox="0 0 68 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 62 Q18 46 34 50 Q50 46 66 62 L66 70 L2 70 Z" fill="#14532D" opacity="0.8"/>
            <path d="M34 50 Q30 44 33 38 Q37 44 34 50 Z" fill="#16A34A"/>
            <line x1="34" y1="50" x2="34" y2="38" stroke="#16A34A" strokeWidth="1" strokeLinecap="round"/>
            <circle cx="34" cy="28" r="18" fill="#D97706"/>
            {rays.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return <line key={deg} x1={34 + Math.cos(rad) * 21} y1={28 + Math.sin(rad) * 21} x2={34 + Math.cos(rad) * 27} y2={28 + Math.sin(rad) * 27} stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>;
            })}
            <circle cx="34" cy="28" r="12" fill="#FDE68A" opacity="0.4"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#D97706", letterSpacing: 1, lineHeight: 1.1 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 400, color: "#0F172A", letterSpacing: "0.35em", lineHeight: 1.8 }}>RECOVERY</div>
          </div>
        </div>

        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
            Amber starburst sun above a rolling hill with a leaf at the peak. Nature, organic healing, growth. Warmest and most human — suited to residential and community-facing collateral.
          </p>
        </div>

      </div>
    </div>
  );
}
