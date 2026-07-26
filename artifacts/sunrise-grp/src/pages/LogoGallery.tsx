import React from 'react';

// ─── SUNRISE RECOVERY MARKS ─────────────────────────────────────────────────

/** Option A — "Daybreak"
 *  Rising semicircle sun + 5 diverging rays + teal horizon with a subtle
 *  EKG spike — the same heartbeat motif as its SunriseOS sibling.
 *  Warm clinical energy; connects the treatment arm to the tech arm.
 */
export function RecoveryMarkA({ width = 68 }: { width?: number }) {
  const h = (width / 68) * 64;
  return (
    <svg width={width} height={h} viewBox="0 0 68 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Horizon + EKG pulse (drawn first so sun covers the centre) */}
      <line x1="2" y1="46" x2="68" y2="46" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      {/* EKG spike — right of sun, sun centre x=34, r=18, so right edge at x=52 */}
      <path d="M52 46 L55.5 38 L58 53 L61 38 L64 46" stroke="#14B8A6" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round"/>

      {/* Rays — 5 lines, upper hemisphere, inner r=21, outer r=34 */}
      {/* 0° (straight up) */}
      <line x1="34" y1="25" x2="34" y2="12" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
      {/* +25° right */}
      <line x1="42.9" y1="27" x2="48.4" y2="15.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
      {/* -25° left */}
      <line x1="25.1" y1="27" x2="19.6" y2="15.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
      {/* +52° right */}
      <line x1="50.5" y1="33" x2="60.8" y2="24.5" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
      {/* -52° left */}
      <line x1="17.5" y1="33" x2="7.2" y2="24.5" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Sun — upper semicircle, centre (34,46) r=18 */}
      <path d="M16 46 A18 18 0 0 0 52 46 Z" fill="#F97316"/>
    </svg>
  );
}

export function RecoveryLogoA() {
  return (
    <div className="flex items-center gap-5">
      <RecoveryMarkA width={72} />
      <div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#F97316', letterSpacing: 1, lineHeight: 1.1 }}>
          SUNRISE
        </div>
        <div style={{ fontFamily: "'Outfit', 'Helvetica Neue', sans-serif", fontSize: 12, fontWeight: 400, color: '#F8FAFC', letterSpacing: 5, lineHeight: 1.8 }}>
          RECOVERY
        </div>
      </div>
    </div>
  );
}

/** Option B — "Renewal"
 *  Full amber sun circle with classic starburst rays, floating above a
 *  gently curved hill silhouette with a small leaf — nature, healing, growth.
 *  Warmer and more human than A; less tech-adjacent.
 */
export function RecoveryMarkB({ width = 68 }: { width?: number }) {
  const h = (width / 68) * 70;
  return (
    <svg width={width} height={h} viewBox="0 0 68 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hill silhouette */}
      <path d="M2 62 Q18 46 34 50 Q50 46 66 62 L66 70 L2 70 Z" fill="#166534" opacity="0.85"/>
      {/* Leaf sprout on hill peak */}
      <path d="M34 50 Q30 44 33 38 Q37 44 34 50 Z" fill="#16A34A"/>
      <line x1="34" y1="50" x2="34" y2="38" stroke="#16A34A" strokeWidth="1" strokeLinecap="round"/>

      {/* Sun circle */}
      <circle cx="34" cy="28" r="18" fill="#F59E0B"/>

      {/* 8-point starburst rays — short, outer ring only */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 34 + Math.cos(rad) * 21;
        const y1 = 28 + Math.sin(rad) * 21;
        const x2 = 34 + Math.cos(rad) * 27;
        const y2 = 28 + Math.sin(rad) * 27;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>;
      })}

      {/* Soft inner glow ring */}
      <circle cx="34" cy="28" r="12" fill="#FDE68A" opacity="0.35"/>
    </svg>
  );
}

export function RecoveryLogoB() {
  return (
    <div className="flex items-center gap-5">
      <RecoveryMarkB width={72} />
      <div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#F59E0B', letterSpacing: 1, lineHeight: 1.1 }}>
          SUNRISE
        </div>
        <div style={{ fontFamily: "'Outfit', 'Helvetica Neue', sans-serif", fontSize: 12, fontWeight: 400, color: '#F8FAFC', letterSpacing: 5, lineHeight: 1.8 }}>
          RECOVERY
        </div>
      </div>
    </div>
  );
}

/** Option C — "Meridian"
 *  Sunrise scene contained inside a teal circle — the arc of the circle
 *  mirrors the arc of the sun; the horizon divides night from day.
 *  Works at any scale, reads as an icon/avatar badge.
 */
export function RecoveryMarkC({ width = 68 }: { width?: number }) {
  const h = (width / 68) * 68;
  return (
    <svg width={width} height={h} viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle cx="34" cy="34" r="30" stroke="#14B8A6" strokeWidth="2.5" fill="none"/>
      {/* Lower-half subtle fill */}
      <path d="M4 34 A30 30 0 0 0 64 34 Z" fill="#14B8A6" opacity="0.06"/>

      {/* Horizon line inside circle */}
      <line x1="5" y1="34" x2="63" y2="34" stroke="#14B8A6" strokeWidth="1" opacity="0.5"/>

      {/* Sun disc — centred on horizon */}
      <circle cx="34" cy="34" r="10" fill="#F97316"/>

      {/* 5 rays from sun — upper hemisphere only — ending near ring edge */}
      {/* 0° (up) */}
      <line x1="34" y1="23" x2="34" y2="7" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round"/>
      {/* ±28° */}
      <line x1="38.7" y1="24.2" x2="46.8" y2="10.2" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="29.3" y1="24.2" x2="21.2" y2="10.2" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round"/>
      {/* ±55° */}
      <line x1="42.2" y1="28.2" x2="55.8" y2="18.4" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="25.8" y1="28.2" x2="12.2" y2="18.4" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function RecoveryLogoC() {
  return (
    <div className="flex items-center gap-5">
      <RecoveryMarkC width={72} />
      <div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#F97316', letterSpacing: 1, lineHeight: 1.1 }}>
          SUNRISE
        </div>
        <div style={{ fontFamily: "'Outfit', 'Helvetica Neue', sans-serif", fontSize: 12, fontWeight: 400, color: '#F8FAFC', letterSpacing: 5, lineHeight: 1.8 }}>
          RECOVERY
        </div>
      </div>
    </div>
  );
}

// ─── SUNRISE FOUNDATION MARKS ────────────────────────────────────────────────

/** Option A — "Pillars"
 *  Three graduated columns (left/right equal, centre tallest) beneath a
 *  golden sun disc. Architectural metaphor: the Foundation as the structural
 *  base that holds everything up. Institutional and dignified.
 */
export function FoundationMarkA({ width = 68 }: { width?: number }) {
  const h = (width / 68) * 68;
  return (
    <svg width={width} height={h} viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Baseline */}
      <line x1="4" y1="62" x2="64" y2="62" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Pillars */}
      <rect x="8" y="46" width="13" height="16" rx="1" fill="#0D9488" opacity="0.85"/>
      <rect x="27.5" y="28" width="13" height="34" rx="1" fill="#0D9488"/>
      <rect x="47" y="46" width="13" height="16" rx="1" fill="#0D9488" opacity="0.85"/>

      {/* Sun disc above centre pillar */}
      <circle cx="34" cy="18" r="12" fill="#D97706"/>

      {/* 4 short rays: up, left, right + 2 diagonal */}
      <line x1="34" y1="5" x2="34" y2="2" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
      <line x1="46" y1="18" x2="49" y2="18" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="18" x2="19" y2="18" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
      <line x1="42.5" y1="9.5" x2="44.6" y2="7.4" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
      <line x1="25.5" y1="9.5" x2="23.4" y2="7.4" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function FoundationLogoA() {
  return (
    <div className="flex items-center gap-5">
      <FoundationMarkA width={72} />
      <div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 600, color: '#D97706', letterSpacing: 2, lineHeight: 1.3, fontStyle: 'italic' }}>
          THE SUNRISE
        </div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#F8FAFC', letterSpacing: 1, lineHeight: 1.1 }}>
          FOUNDATION
        </div>
      </div>
    </div>
  );
}

/** Option B — "Luminary"
 *  A golden diamond outline containing a rising sun inside — the diamond
 *  suggests value, protection, and permanence. The sun within signals that
 *  the Foundation's purpose is to illuminate the path for others.
 */
export function FoundationMarkB({ width = 68 }: { width?: number }) {
  const h = (width / 68) * 70;
  return (
    <svg width={width} height={h} viewBox="0 0 68 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Diamond outline */}
      <path d="M34 4 L63 34 L34 66 L5 34 Z" stroke="#D97706" strokeWidth="2" fill="none" strokeLinejoin="round"/>
      {/* Inner tint */}
      <path d="M34 4 L63 34 L34 66 L5 34 Z" fill="#D97706" opacity="0.05"/>

      {/* Sun — positioned in upper-centre of diamond */}
      <circle cx="34" cy="30" r="13" fill="#D97706"/>
      {/* Inner highlight */}
      <circle cx="34" cy="30" r="8" fill="#FDE68A" opacity="0.4"/>

      {/* 5 rays — upper hemisphere only */}
      {/* 0° up */}
      <line x1="34" y1="16" x2="34" y2="8" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
      {/* ±28° */}
      <line x1="40.1" y1="18.5" x2="46.5" y2="11.8" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="27.9" y1="18.5" x2="21.5" y2="11.8" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round"/>
      {/* ±55° */}
      <line x1="44.6" y1="24.5" x2="54" y2="20.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="23.4" y1="24.5" x2="14" y2="20.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Horizon line inside diamond, lower segment */}
      <line x1="14" y1="34" x2="54" y2="34" stroke="#D97706" strokeWidth="1" opacity="0.3"/>
    </svg>
  );
}

export function FoundationLogoB() {
  return (
    <div className="flex items-center gap-5">
      <FoundationMarkB width={68} />
      <div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 600, color: '#D97706', letterSpacing: 2, lineHeight: 1.3, fontStyle: 'italic' }}>
          THE SUNRISE
        </div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#F8FAFC', letterSpacing: 1, lineHeight: 1.1 }}>
          FOUNDATION
        </div>
      </div>
    </div>
  );
}

/** Option C — "Reach"
 *  Three upward-arching branches converge on a golden sun at the apex —
 *  three paths (communities, individuals, partners) all reaching toward the
 *  same light. Warmest and most human of the three Foundation options.
 */
export function FoundationMarkC({ width = 68 }: { width?: number }) {
  const h = (width / 68) * 70;
  return (
    <svg width={width} height={h} viewBox="0 0 68 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Base arc — the common ground all three paths rise from */}
      <path d="M10 62 Q34 68 58 62" stroke="#0D9488" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

      {/* Three upward-reaching branches */}
      {/* Left branch */}
      <path d="M12 62 Q14 44 22 22" stroke="#0D9488" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Centre branch */}
      <path d="M34 62 L34 18" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Right branch */}
      <path d="M56 62 Q54 44 46 22" stroke="#0D9488" strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* Sun at apex — where all branches reach */}
      <circle cx="34" cy="14" r="12" fill="#D97706"/>
      <circle cx="34" cy="14" r="7" fill="#FDE68A" opacity="0.45"/>

      {/* Small rays */}
      <line x1="34" y1="1" x2="34" y2="-2" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
      <line x1="43.5" y1="4.5" x2="46" y2="2" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="24.5" y1="4.5" x2="22" y2="2" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="46" y1="14" x2="49" y2="14" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="22" y1="14" x2="19" y2="14" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function FoundationLogoC() {
  return (
    <div className="flex items-center gap-5">
      <FoundationMarkC width={72} />
      <div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 600, color: '#D97706', letterSpacing: 2, lineHeight: 1.3, fontStyle: 'italic' }}>
          THE SUNRISE
        </div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#F8FAFC', letterSpacing: 1, lineHeight: 1.1 }}>
          FOUNDATION
        </div>
      </div>
    </div>
  );
}

// ─── GALLERY PAGE ────────────────────────────────────────────────────────────

interface OptionCardProps {
  label: string;
  subtitle: string;
  description: string;
  children: React.ReactNode;
}

function OptionCard({ label, subtitle, description, children }: OptionCardProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <div className="bg-[#0F172A] p-8 flex items-center justify-center min-h-36">
        {children}
      </div>
      <div className="bg-white p-8 flex items-center justify-center min-h-36 border-t border-gray-100">
        <div style={{ filter: 'invert(0)' }} className="opacity-100">
          {/* Light background version — swap colours via CSS filter approach */}
          <div style={{ filter: 'brightness(0.6) saturate(1.5)' }}>
            {children}
          </div>
        </div>
      </div>
      <div className="bg-[#111827] p-6 border-t border-white/10">
        <div className="text-xs font-semibold tracking-widest text-primary mb-1 uppercase">{label}</div>
        <div className="text-sm font-semibold text-white mb-2">{subtitle}</div>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function LogoGallery() {
  return (
    <div className="min-h-screen bg-[#0A1628] pt-32 pb-24">
      <div className="container mx-auto px-6 md:px-12 max-w-6xl">

        {/* Header */}
        <div className="mb-20">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-4">Internal — Brand Options</p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-5xl text-white mb-6">
            Logo Concepts
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Three directions each for Sunrise Recovery and The Sunrise Foundation.
            All marks share the family's sunrise motif and are designed to work
            on both the dark-navy corporate site and white print collateral.
            The top row of each card shows the dark-background rendering; the
            middle row previews on white.
          </p>
        </div>

        {/* Reference — existing family marks */}
        <section className="mb-20">
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-2xl text-white mb-2">
            The Family — For Reference
          </h2>
          <p className="text-slate-500 text-sm mb-8">Existing approved marks the new logos must harmonise with.</p>
          <div className="flex flex-wrap gap-10 items-center bg-[#0F172A] border border-white/10 rounded-xl p-8">
            <div className="text-center">
              <img src="/sunrise-grp/sunrise-grp-logo-solid.png" alt="The Sunrise Grp." className="h-14 w-auto object-contain mx-auto mb-2"/>
              <div className="text-xs text-slate-500 tracking-widest uppercase">The Sunrise Grp.</div>
            </div>
            <div className="w-px h-12 bg-white/10"/>
            <div className="text-center">
              <img src="/sunrise-grp/logo-sunriseos-official.png" alt="SunriseOS" className="h-14 w-auto object-contain mx-auto mb-2"/>
              <div className="text-xs text-slate-500 tracking-widest uppercase">SunriseOS</div>
            </div>
            <div className="w-px h-12 bg-white/10"/>
            <div className="text-center">
              <img src="/sunrise-grp/logo-grow.png" alt="Grow Motivational" className="h-14 w-auto object-contain mx-auto mb-2"/>
              <div className="text-xs text-slate-500 tracking-widest uppercase">Grow Motivational</div>
            </div>
          </div>
        </section>

        {/* ── SUNRISE RECOVERY ── */}
        <section className="mb-20">
          <div className="flex items-baseline gap-4 mb-2">
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-3xl text-white">
              Sunrise Recovery
            </h2>
            <span className="text-xs text-slate-500 tracking-widest uppercase">Clinical Operations</span>
          </div>
          <p className="text-slate-400 text-sm mb-8 max-w-2xl">
            Treatment centres across Delaware and the Mid-Atlantic. Tone should read:
            hopeful, warm, professional — the sunrise as metaphor for a new day in recovery.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OptionCard
              label="Option A"
              subtitle='"Daybreak"'
              description='Half-sun with 5 diverging rays sits on a teal horizon line that carries a subtle EKG pulse — a quiet callback to the SunriseOS sibling. Most clinical and tech-adjacent of the three.'
            >
              <RecoveryLogoA />
            </OptionCard>
            <OptionCard
              label="Option B"
              subtitle='"Renewal"'
              description='Amber starburst sun above a rolling hill silhouette with a small leaf at the peak. Nature, organic healing, growth. Warmer and more human — suited to residential / community-facing collateral.'
            >
              <RecoveryLogoB />
            </OptionCard>
            <OptionCard
              label="Option C"
              subtitle='"Meridian"'
              description='Sunrise contained in a teal ring — the arc of the circle mirrors the arc of the sun; a horizon line divides night from day. Most versatile: scales to app icon, badge, or embossed letterhead.'
            >
              <RecoveryLogoC />
            </OptionCard>
          </div>
        </section>

        {/* ── THE SUNRISE FOUNDATION ── */}
        <section>
          <div className="flex items-baseline gap-4 mb-2">
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-3xl text-white">
              The Sunrise Foundation
            </h2>
            <span className="text-xs text-slate-500 tracking-widest uppercase">501(c)(3) Philanthropy</span>
          </div>
          <p className="text-slate-400 text-sm mb-8 max-w-2xl">
            Removes financial barriers to care for underserved populations.
            Tone should read: noble, accessible, warm — gold signals generosity and value,
            teal keeps the connection to the clinical family.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OptionCard
              label="Option A"
              subtitle='"Pillars"'
              description='Three teal columns of graduated height beneath a golden sun disc — centre pillar tallest, like a colonnaded portico. Architectural and institutional. Evokes permanence and structural support.'
            >
              <FoundationLogoA />
            </OptionCard>
            <OptionCard
              label="Option B"
              subtitle='"Luminary"'
              description='A golden diamond outline containing a rising sun inside. The diamond signals value and protection; the sun inside signals purpose — illuminating the path for others. Most prestigious of the three.'
            >
              <FoundationLogoB />
            </OptionCard>
            <OptionCard
              label="Option C"
              subtitle='"Reach"'
              description='Three branches — left and right in teal, centre in gold — converge on a golden sun at the apex. Three paths (communities, individuals, partners) all reaching toward the same light. Most human and emotive.'
            >
              <FoundationLogoC />
            </OptionCard>
          </div>
        </section>

      </div>
    </div>
  );
}
