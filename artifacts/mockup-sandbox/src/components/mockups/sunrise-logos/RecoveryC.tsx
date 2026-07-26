export default function RecoveryC() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>

        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", color: "#14B8A6", textTransform: "uppercase", marginBottom: 6 }}>
            Option C — Sunrise Recovery
          </div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#64748B" }}>
            "Meridian"
          </div>
        </div>

        {/* Dark */}
        <div style={{ background: "#0F172A", borderRadius: 16, padding: "36px 48px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="80" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="34" cy="34" r="30" stroke="#14B8A6" strokeWidth="2.5" fill="none"/>
            <path d="M4 34 A30 30 0 0 0 64 34 Z" fill="#14B8A6" opacity="0.06"/>
            <line x1="5" y1="34" x2="63" y2="34" stroke="#14B8A6" strokeWidth="1" opacity="0.5"/>
            <circle cx="34" cy="34" r="10" fill="#F97316"/>
            <line x1="34" y1="23" x2="34" y2="7" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="38.7" y1="24.2" x2="46.8" y2="10.2" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="29.3" y1="24.2" x2="21.2" y2="10.2" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="42.2" y1="28.2" x2="55.8" y2="18.4" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="25.8" y1="28.2" x2="12.2" y2="18.4" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#F97316", letterSpacing: 1, lineHeight: 1.1 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 400, color: "#F8FAFC", letterSpacing: "0.35em", lineHeight: 1.8 }}>RECOVERY</div>
          </div>
        </div>

        {/* White */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "36px 48px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="80" height="80" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="34" cy="34" r="30" stroke="#0D9488" strokeWidth="2.5" fill="none"/>
            <path d="M4 34 A30 30 0 0 0 64 34 Z" fill="#0D9488" opacity="0.07"/>
            <line x1="5" y1="34" x2="63" y2="34" stroke="#0D9488" strokeWidth="1" opacity="0.4"/>
            <circle cx="34" cy="34" r="10" fill="#EA6C00"/>
            <line x1="34" y1="23" x2="34" y2="7" stroke="#EA6C00" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="38.7" y1="24.2" x2="46.8" y2="10.2" stroke="#EA6C00" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="29.3" y1="24.2" x2="21.2" y2="10.2" stroke="#EA6C00" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="42.2" y1="28.2" x2="55.8" y2="18.4" stroke="#EA6C00" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="25.8" y1="28.2" x2="12.2" y2="18.4" stroke="#EA6C00" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#EA6C00", letterSpacing: 1, lineHeight: 1.1 }}>SUNRISE</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 400, color: "#0F172A", letterSpacing: "0.35em", lineHeight: 1.8 }}>RECOVERY</div>
          </div>
        </div>

        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
            Sunrise inside a teal ring — the arc mirrors the arc of the sun; a horizon divides night from day. Most versatile: scales to app icon, badge, or embossed letterhead.
          </p>
        </div>

      </div>
    </div>
  );
}
