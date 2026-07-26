export default function FoundationA() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>

        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", color: "#D97706", textTransform: "uppercase", marginBottom: 6 }}>
            Option A — The Sunrise Foundation
          </div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#64748B" }}>
            "Pillars"
          </div>
        </div>

        {/* Dark */}
        <div style={{ background: "#0F172A", borderRadius: 16, padding: "36px 48px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="80" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="4" y1="62" x2="64" y2="62" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="8" y="46" width="13" height="16" rx="1" fill="#0D9488" opacity="0.85"/>
            <rect x="27.5" y="28" width="13" height="34" rx="1" fill="#0D9488"/>
            <rect x="47" y="46" width="13" height="16" rx="1" fill="#0D9488" opacity="0.85"/>
            <circle cx="34" cy="18" r="12" fill="#D97706"/>
            <line x1="34" y1="5" x2="34" y2="2" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
            <line x1="46" y1="18" x2="49" y2="18" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
            <line x1="22" y1="18" x2="19" y2="18" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
            <line x1="42.5" y1="9.5" x2="44.6" y2="7.4" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
            <line x1="25.5" y1="9.5" x2="23.4" y2="7.4" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 12, fontWeight: 600, color: "#D97706", letterSpacing: "0.15em", lineHeight: 1.3, fontStyle: "italic" }}>THE SUNRISE</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#F8FAFC", letterSpacing: 1, lineHeight: 1.1 }}>FOUNDATION</div>
          </div>
        </div>

        {/* White */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "36px 48px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="80" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="4" y1="62" x2="64" y2="62" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="8" y="46" width="13" height="16" rx="1" fill="#0D9488" opacity="0.75"/>
            <rect x="27.5" y="28" width="13" height="34" rx="1" fill="#0D9488"/>
            <rect x="47" y="46" width="13" height="16" rx="1" fill="#0D9488" opacity="0.75"/>
            <circle cx="34" cy="18" r="12" fill="#D97706"/>
            <line x1="34" y1="5" x2="34" y2="2" stroke="#B45309" strokeWidth="2" strokeLinecap="round"/>
            <line x1="46" y1="18" x2="49" y2="18" stroke="#B45309" strokeWidth="2" strokeLinecap="round"/>
            <line x1="22" y1="18" x2="19" y2="18" stroke="#B45309" strokeWidth="2" strokeLinecap="round"/>
            <line x1="42.5" y1="9.5" x2="44.6" y2="7.4" stroke="#B45309" strokeWidth="2" strokeLinecap="round"/>
            <line x1="25.5" y1="9.5" x2="23.4" y2="7.4" stroke="#B45309" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 12, fontWeight: 600, color: "#B45309", letterSpacing: "0.15em", lineHeight: 1.3, fontStyle: "italic" }}>THE SUNRISE</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: 1, lineHeight: 1.1 }}>FOUNDATION</div>
          </div>
        </div>

        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
            Three graduated columns beneath a golden sun disc — centre pillar tallest, like a colonnaded portico. Architectural and institutional. Evokes permanence and structural support.
          </p>
        </div>

      </div>
    </div>
  );
}
