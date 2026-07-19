/**
 * Sunrise Staff design tokens — derived from the Sunrise OS web palette.
 * Always reference these via useColors() hook. Never hardcode hex values.
 */
const colors = {
  light: {
    // Core surfaces
    text: '#0F172A',
    tint: '#F97316',
    background: '#F8FAFC',
    foreground: '#0F172A',
    card: '#FFFFFF',
    cardForeground: '#0F172A',

    // Primary — sunrise orange
    primary: '#F97316',
    primaryForeground: '#FFFFFF',

    // Secondary
    secondary: '#F1F5F9',
    secondaryForeground: '#1E293B',

    // Muted
    muted: '#F1F5F9',
    mutedForeground: '#64748B',

    // Accent — amber
    accent: '#FBBF24',
    accentForeground: '#0F172A',

    // Destructive
    destructive: '#DC2626',
    destructiveForeground: '#FFFFFF',

    // Borders
    border: '#E2E8F0',
    input: '#E2E8F0',

    // Sunrise-specific tokens
    navy: '#0F172A',
    navyMid: '#1E293B',
    navyLight: '#334155',
    slate: '#475569',
    slateLight: '#64748B',
    orange: '#F97316',
    amber: '#FBBF24',
    gold: '#D97706',
    blue: '#2563EB',
    critical: '#DC2626',
    criticalBg: '#FEF2F2',
    high: '#EA580C',
    highBg: '#FFF7ED',
    moderate: '#D97706',
    moderateBg: '#FFFBEB',
    routine: '#2563EB',
    routineBg: '#EFF6FF',
    success: '#16A34A',
    successBg: '#F0FDF4',
    purple: '#7C3AED',
    purpleBg: '#F5F3FF',
    teal: '#0D9488',
  },
  radius: 10,
};

export default colors;
