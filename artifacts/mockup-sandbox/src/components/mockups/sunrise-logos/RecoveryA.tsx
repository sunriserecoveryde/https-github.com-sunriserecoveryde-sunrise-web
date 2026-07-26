export default function RecoveryA() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>

        {/* Label */}
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>
            Option A — Sunrise Recovery
          </div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#64748B" }}>
            "Daybreak"
          </div>
        </div>

        {/* Logo on dark */}
        <div style={{ background: "#0F172A", borderRadius: 16, padding: "36px 48px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 20 }}>
          {/* Mark */}
          <svg width="80" height="70" viewBox="0 0 68 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="2" y1="46" x2="68" y2="46" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
            <path d="M52 46 L55.5 38 L58 53 L61 38 L64 46" stroke="#14B8A6" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
            <line x1="34" y1="25" x2="34" y2="12" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
            <line x1="42.9" y1="27" x2="48.4" y2="15.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
            <line x1="25.1" y1="27" x2="19.6" y2="15.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
            <line x1="50.5" y1="33" x2="60.8" y2="24.5" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="17.5" y1="33" x2="7.2" y2="24.5" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M16 46 A18 18 0 0 0 52 46 Z" fill="#F97316"/>
          </svg>
          {/* Wordmark */}
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#F97316", letterSpacing: 1, lineHeight: 1.1 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 400, color: "#F8FAFC", letterSpacing: "0.35em", lineHeight: 1.8 }}>RECOVERY</div>
          </div>
        </div>

        {/* Logo on white */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "36px 48px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="70" viewBox="0 0 68 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="2" y1="46" x2="68" y2="46" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
            <path d="M52 46 L55.5 38 L58 53 L61 38 L64 46" stroke="#0D9488" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
            <line x1="34" y1="25" x2="34" y2="12" stroke="#EA6C00" strokeWidth="2" strokeLinecap="round"/>
            <line x1="42.9" y1="27" x2="48.4" y2="15.5" stroke="#EA6C00" strokeWidth="2" strokeLinecap="round"/>
            <line x1="25.1" y1="27" x2="19.6" y2="15.5" stroke="#EA6C00" strokeWidth="2" strokeLinecap="round"/>
            <line x1="50.5" y1="33" x2="60.8" y2="24.5" stroke="#EA6C00" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="17.5" y1="33" x2="7.2" y2="24.5" stroke="#EA6C00" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M16 46 A18 18 0 0 0 52 46 Z" fill="#EA6C00"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#EA6C00", letterSpacing: 1, lineHeight: 1.1 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 400, color: "#0F172A", letterSpacing: "0.35em", lineHeight: 1.8 }}>RECOVERY</div>
          </div>
        </div>

        {/* Description */}
        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
            Half-sun with rays sits on a teal horizon carrying a subtle EKG pulse — a quiet callback to the SunriseOS sibling. Most clinical and tech-adjacent of the three.
          </p>
        </div>

      </div>
    </div>
  );
}
