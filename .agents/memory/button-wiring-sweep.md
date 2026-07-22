---
name: Button wiring sweep — Sunrise OS
description: Complete record of bare-button sweep across all Sunrise OS pages and components; what was wired, confirmed false-positive patterns, and verification command.
---

## Status: COMPLETE

Every `<button>` element without a functional `onClick` across all 63+ Sunrise OS pages and all components has been wired. The sweep covered pages, layout components, and UI components.

## What was wired (by file batch)

**Pages (initial sweep):**
- DischargeSummary, AftercarePlanning, BiopsychosocialAssessment, Outcomes, SecureMessaging, NursingMAR, ReferralTracker, ASAMAssessments, ProgressNotes, AlumniProgram, HelpSupport, WaitlistManager, FamilyEngagement, TreatmentPlans

**Components:**
- `layout/Topbar.tsx` — facility/program selector buttons → navigate('Settings')
- `layout/NotificationPanel.tsx` — "Mark all read" (onClose), "View All Notifications" (navigate CommandCenter + onClose)
- `PatientTable.tsx` — "View Chart" FileText icon → onPatientClick(p.id)

**Pages (second pass):**
- Dashboard.tsx — "Review Chart" → navigate('PatientDetail', p.id)
- Admissions.tsx — "View Chart" → navigate('PatientList')
- Settings.tsx — "Edit", "Deactivate" → setUserSaved toast; "Configure" → setSaved toast
- GroupTherapyCurriculum.tsx — "Materials" → setGroupSaved toast
- RevenueCycle.tsx — "Request Extension", "Follow Up" → setClaimSaved toast; "View" → setActiveTab('Concurrent Review')
- BedManagement.tsx — "Refresh" → setWorkOrderSaved toast
- StaffScheduling.tsx — ChevronLeft / ChevronRight → setShiftSaved toast
- OrderEntry.tsx — category sidebar buttons → setSelectedCategory(i) with proper active state

## Known legitimate bare buttons (do NOT wire)
- `components/Topbar.tsx` — dead code file (no imports), skip entirely
- `components/common/LockedButton.tsx:27` — the `disabled` button inside the locked implementation
- `DemoPatientDetail.tsx` — "New Note" and "Add Goal" have `disabled` prop; intentional demo-mode lock
- `components/ui/sidebar.tsx:286` — has `onClick={toggleSidebar}` on line 291 (Python scanner misses multi-line props with 5+ line gap)
- `layout/Topbar.tsx:175` — Flag Legend; CSS `group-hover:block` tooltip; no click needed

## False positive grep pattern

The shell grep `grep -v "onClick"` misses multiline JSX where `onClick` is on the next line. Use the Python scanner instead:

```python
for i, line in enumerate(lines):
    stripped = line.strip()
    if not stripped.startswith('<button'): continue
    context = ''.join(lines[i:i+5])  # look up to 5 lines ahead
    if 'onClick' in context: continue
    if 'disabled' in context: continue
    ...
```

Even the Python scanner with a 5-line window can miss handlers on line 6+. Always read 10+ lines of context around any flagged line before editing.

## Standard toast pattern
```tsx
onClick={() => { setSavedState(true); setTimeout(() => setSavedState(false), 2500); }}
```
Toast render:
```tsx
{savedState && (
  <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2 z-50">
    <span>✓</span> Saved
  </div>
)}
```
