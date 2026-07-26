export default function FoundationB() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>

        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", color: "#D97706", textTransform: "uppercase", marginBottom: 6 }}>
            Option B — The Sunrise Foundation
          </div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#64748B" }}>
            "Luminary"
          </div>
        </div>

        {/* Dark */}
        <div style={{ background: "#0F172A", borderRadius: 16, padding: "36px 48px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="82" viewBox="0 0 68 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M34 4 L63 34 L34 66 L5 34 Z" stroke="#D97706" strokeWidth="2" fill="none" strokeLinejoin="round"/>
            <path d="M34 4 L63 34 L34 66 L5 34 Z" fill="#D97706" opacity="0.05"/>
            <circle cx="34" cy="30" r="13" fill="#D97706"/>
            <circle cx="34" cy="30" r="8" fill="#FDE68A" opacity="0.4"/>
            <line x1="34" y1="16" x2="34" y2="8" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
            <line x1="40.1" y1="18.5" x2="46.5" y2="11.8" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="27.9" y1="18.5" x2="21.5" y2="11.8" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="44.6" y1="24.5" x2="54" y2="20.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="23.4" y1="24.5" x2="14" y2="20.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="14" y1="34" x2="54" y2="34" stroke="#D97706" strokeWidth="1" opacity="0.3"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 12, fontWeight: 600, color: "#D97706", letterSpacing: "0.15em", lineHeight: 1.3, fontStyle: "italic" }}>THE SUNRISE</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#F8FAFC", letterSpacing: 1, lineHeight: 1.1 }}>FOUNDATION</div>
          </div>
        </div>

        {/* White */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "36px 48px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="82" viewBox="0 0 68 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M34 4 L63 34 L34 66 L5 34 Z" stroke="#B45309" strokeWidth="2" fill="none" strokeLinejoin="round"/>
            <path d="M34 4 L63 34 L34 66 L5 34 Z" fill="#D97706" opacity="0.06"/>
            <circle cx="34" cy="30" r="13" fill="#D97706"/>
            <circle cx="34" cy="30" r="8" fill="#FDE68A" opacity="0.45"/>
            <line x1="34" y1="16" x2="34" y2="8" stroke="#B45309" strokeWidth="2" strokeLinecap="round"/>
            <line x1="40.1" y1="18.5" x2="46.5" y2="11.8" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="27.9" y1="18.5" x2="21.5" y2="11.8" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="44.6" y1="24.5" x2="54" y2="20.5" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="23.4" y1="24.5" x2="14" y2="20.5" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="14" y1="34" x2="54" y2="34" stroke="#B45309" strokeWidth="1" opacity="0.25"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 12, fontWeight: 600, color: "#B45309", letterSpacing: "0.15em", lineHeight: 1.3, fontStyle: "italic" }}>THE SUNRISE</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: 1, lineHeight: 1.1 }}>FOUNDATION</div>
          </div>
        </div>

        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
            A golden diamond containing a rising sun. The diamond signals value and protection; the sun within signals purpose — illuminating the path for others. Most prestigious of the three.
          </p>
        </div>

      </div>
    </div>
  );
}
