# Sunrise OS — Evidence Index

**Audit Date:** 2026-08-01

This index maps each audit claim to its source evidence — file, line range, or test file.

---

## Build Evidence

| Claim | Evidence |
|---|---|
| Build is clean | `pnpm build` output: ✓ built in 13.21s, no errors |
| TypeScript is clean | `pnpm typecheck` exits 0 |
| Bundle size >4.8 MB | Build output: `dist/public/assets/index-R0fC0AZE.js 4843.18 kB (gzip: 1256.08 kB)` |
| Chunk size warning | Build warning: `Some chunks are larger than 500 kB after minification` |
| 96 unit tests passing | `pnpm test` output: Tests 96 passed (96) in 7 files, 415ms |
| No integration/E2E tests | `find artifacts/sunrise-os/src -name "*.test.ts" | wc -l` returns 7; all in `__tests__/`; all unit-only |

---

## Application Structure Evidence

| Claim | Evidence |
|---|---|
| 70 page files | `find artifacts/sunrise-os/src/pages -name "*.tsx" | wc -l` = 70 |
| 59 routed screens | `App.tsx` lines 229–295: case statements in screen router |
| Vite + React build | `artifacts/sunrise-os/package.json` devDependencies; `vite.config.ts` |
| TypeScript strict-ish | `tsconfig.json`: `noImplicitAny`, `strictNullChecks`, `noImplicitReturns` true; `strict` umbrella not set |
| Tailwind CSS | `package.json` dependency; `vite.config.ts` Tailwind plugin |
| No backend for Sunrise OS UI | `App.tsx` imports no fetch/axios; no `useEffect` API calls to external backend in routing layer |
| localStorage usage in 3 pages only | `grep -rn localStorage src/pages/` → Dashboard.tsx (quick-action pins), UADrugTesting.tsx (workflow items), WorkforceCompliance.tsx (filter/evidence state) |

---

## Role & Permission Evidence

| Claim | Evidence |
|---|---|
| 17 roles defined | `src/data/mockRoles.ts` lines 53–331 |
| full/read/none permission model | `src/data/mockRoles.ts` line 1 type definition |
| Permission resolution function | `src/data/mockRoles.ts` `getPermission()` lines 335–347 |
| `none` renders AccessDenied | `src/App.tsx` `withAccess()` lines 206–213 |
| `read` renders ReadOnlyBanner | `src/App.tsx` `withAccess()` lines 206–213 |
| ReadOnlyBanner disables all interaction | `src/components/common/ReadOnlyBanner.tsx` line 38: `pointer-events-none select-none opacity-75` |
| LockedButton present | `src/components/common/LockedButton.tsx` |
| RoleExplorer always accessible | `src/data/mockRoles.ts` `DEMO` convenience group; `getPermission('RoleExplorer')` returns `read` for all |

---

## AI Subsystem Evidence

| Claim | Evidence |
|---|---|
| No external API calls in AI features | `grep -rn "fetch\|axios\|import.*openai\|import.*anthropic" src/components/ui/ProgressNoteAIAssist.tsx src/lib/aiNoteEngine.ts` → 0 results |
| Per-section clarity (clarityConfig.ts) | `src/components/ui/clarityConfig.ts` — 339 lines, exported `runClarityReview()`, `detectStaleSection()` |
| Stale detection bug fix (values[fieldLabel] not values[fieldId]) | `src/components/ui/clarityConfig.ts` `runClarityReview()` — stale check uses `values[section.fieldLabel]` |
| Stable ID format for clarity findings | `src/components/ui/clarityConfig.ts`: `id: \`clarity:${section.fieldId}\`` |
| 5-step review pipeline | `src/components/ui/ProgressNoteAIAssist.tsx` pipeline: draft → clarity → consistency → medical necessity → completeness |
| Wet signature implementation | `src/components/ui/SignatureModal.tsx`, `src/components/ui/WetSignatureCanvas.tsx` |
| AI audit events emitted but not persisted | `src/pages/ProgressNotes.tsx` `aiAuditLog: useState([])` — in-memory; no persistence |
| Safety disclaimer present in AI panel | `src/components/ui/ProgressNoteAIAssist.tsx` disclaimer text in render |
| Insert requires explicit confirmation | `ProgressNoteAIAssist.tsx` overwrite confirmation dialog before `onInsertDraft()` call |
| Focus trap in AI panel | `ProgressNoteAIAssist.tsx` `handleKeyDown` — Tab/Shift-Tab focus trap |
| Live region announcement on insert | `src/pages/ProgressNotes.tsx` `liveRegionRef` with `role="status" aria-live="polite"` |
| Stale warning uses alertdialog role | `ProgressNoteAIAssist.tsx` `role="alertdialog" aria-labelledby aria-describedby` |

---

## Test Coverage Evidence

| Claim | Evidence File | Tests |
|---|---|---|
| Clarity config fully tested | `src/components/ui/__tests__/clarityConfig.test.ts` | 26 |
| Medical necessity config tested | `src/components/ui/__tests__/medicalNecessityConfig.test.ts` | 28 |
| Clarity accept isolation tested | `src/components/ui/__tests__/clarityAcceptIsolation.test.ts` | 11 |
| Stale gate behavior tested | `src/components/ui/__tests__/clarityStaleGate.test.ts` | 10 |
| Accept All stale guard tested | `src/components/ui/__tests__/acceptAllStaleGuard.test.ts` | 8 |
| Stale queue advancement tested | `src/components/ui/__tests__/staleQueueAdvancement.test.ts` | 8 |
| Accept All callback suppression tested | `src/components/ui/__tests__/acceptAllCallbackNotFired.test.ts` | 5 |
| No component render tests | `find src -name "*.test.tsx" | wc -l` = 0 |
| No E2E tests | No Playwright/Cypress config found |

---

## Compliance Evidence

| Claim | Evidence |
|---|---|
| 42 CFR Part 2 reference guide | `src/pages/MedicalRecords.tsx` — 42 CFR Guide tab with full reference text |
| `requires42CFR` flag on ROI records | `src/pages/MedicalRecords.tsx` ROI data structures |
| Notice to Accompany text | `src/pages/MedicalRecords.tsx` — notice text hardcoded in UI |
| CARF/Joint Commission standards | `src/pages/WorkforceCompliance.tsx` (4,300 lines) — full requirement list |
| Evidence confirmation in localStorage | `src/pages/WorkforceCompliance.tsx` `COMPLIANCE_EVIDENCE_CONFIRMED_KEY` localStorage key |
| Storage quota handling | `src/pages/WorkforceCompliance.tsx` line ~1324: `storageFullOnLoad` state; try/catch on all localStorage writes |

---

## Data Model Evidence

| Claim | Evidence |
|---|---|
| 32 mock patients | `src/data/mockPatients.ts` `MOCK_PATIENTS` array |
| 72 additional patients in demoExpansion | `src/data/demoExpansion.ts`: 40 active + 40 discharged (some overlap with base set) |
| Fictional patient data marker | `mockPatients.ts` patients flagged as fictional |
| Demo banner always shown | `src/components/ui/DemoBanner.tsx`; rendered in `App.tsx` |
| No real PHI | All names, MRNs, and diagnoses in mock data files are fabricated |

---

## Security Gap Evidence

| Claim | Evidence |
|---|---|
| No authentication credentials | `src/pages/LoginPage.tsx` — staff picker with no password field |
| No server-side authorization | No fetch calls with auth headers in any page component |
| AI events logged to console in dev | `createAuditEvent()` in ProgressNoteAIAssist.tsx: `console.info('[AI Audit]', ...)` |
| InactivityModal present | `src/components/ui/InactivityModal.tsx` — warns but does not terminate session |
| No session termination | No `document.cookie` clearing or sessionStorage clearing in logout flow |
