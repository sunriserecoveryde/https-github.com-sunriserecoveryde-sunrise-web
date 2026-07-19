---
name: Sunrise Staff Mobile
description: Expo companion app for Sunrise OS — structure, data, role context, pitfalls
---

## Artifact
`artifacts/sunrise-staff/` — Expo mobile app, preview path `/sunrise-staff/`
Workflow: `artifacts/sunrise-staff: expo`

## Color Palette
Synced from Sunrise OS CSS. Key tokens in `constants/colors.ts`:
- `navy: #0F172A`, `navyMid: #1E293B`, `navyLight: #334155`
- `orange: #F97316` (primary), `amber: #FBBF24`, `gold: #D97706`
- `critical: #DC2626`, `high: #EA580C`, `moderate: #D97706`, `routine: #2563EB`, `success: #16A34A`
- Also: `criticalBg`, `highBg`, `moderateBg`, `routineBg`, `successBg`, `purple`, `purpleBg`, `teal`

## Role Context
`context/RoleContext.tsx` — `Role = 'nursing' | 'bht'`, shared via `useRole()`
- RoleProvider wraps all screens in `app/_layout.tsx`
- Role switcher (RN/BHT pill) rendered inline in every screen's custom header

## Data
`data/mockData.ts` — self-contained (not imported from sunrise-os):
- 12 `PATIENTS` (p1–p12), 8 residential with beds 1A–4B, 4 PHP/IOP without beds
- `RESIDENTIAL_PATIENTS` = filter of program === 'Residential'
- `MEDICATIONS: Record<string, Medication[]>` for p1–p8
- `VITALS: Record<string, VitalEntry[]>` for p1, p4, p5, p8
- `BEDS` array with statuses (Occupied/Available/Cleaning)
- Helpers: `acuityColor(acuity)` → `{ text, bg, border }`, `acuitySortOrder(acuity)`

## Screens (4 tabs, headerShown: false, custom headers per screen)
- `(tabs)/index.tsx` — Census Board: bed grid, acuity filter, COWS/CIWA scores, mood bar
- `(tabs)/mar.tsx` — MAR (nursing role) or Morning Checks (bht role) with role-aware content
- `(tabs)/handoff.tsx` — Shift Handoff: shift selector, sorted patient list, inline note editing, complete action
- `(tabs)/incidents.tsx` — Incident reports + UA specimen log with inline modals

## Navigation
- NativeTabs (iOS 26+) or ClassicTabs with BlurView — both in `(tabs)/_layout.tsx`
- Tab labels are role-aware for the MAR tab ("MAR" for nursing, "Checks" for BHT)
- No patient detail route yet — see proposed follow-up task #8

## Web Insets Pattern
```tsx
const insets = useSafeAreaInsets();
const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
// FlatList: contentContainerStyle={{ paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0) }}
```

**Why:** Web has no native safe area; 67px top + 84px tab bar height is required per Expo skill guidelines.

## Known Pitfalls
- All state (MAR checks, BHT check-ins) resets on app restart — in-memory only (intentional for demo, tech debt task #9)
- `shadow*` style props produce deprecation warnings (cosmetic, harmless in Expo Go)
- Apostrophes in patient names (O'Brien) require string literal — safe in TS object literals but watch JSX text nodes
