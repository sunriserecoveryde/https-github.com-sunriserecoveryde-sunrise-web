---
name: Quality sweep v3 + v4
description: Full date-coherence sweep (July 22, 2026), covering every "current" date comparator, week label, scheduled appointment, review date, chart endpoint, and census stat across all 65 Sunrise OS pages.
---

## What was done — v3 (prior session)

### Week labels corrected (all now show Jul 20–26 week, Wednesday Jul 22 = CURRENT_DAY 2)
- AppointmentCalendar: CURRENT_DAY 4 (Fri) → 2 (Wed); WEEK_DAYS corrected to Mon 7/20–Fri 7/24; week header updated
- CommandCenter: Scorecard week "July 21–25" → "July 20–24"
- GroupNotes: Curriculum week "July 21–27" → "July 20–26"
- UADrugTesting: Testing schedule "July 21–27" → "July 20–26"
- StaffScheduling: Both week headers corrected to "July 20–26, 2026"

### Hardcoded "today" comparators updated to '2026-07-22'
- StaffAdmin, PeerSupport (soberYears), CertificationTracker (daysUntil), BusinessDevelopment (×3)

### nextReviewDate / nextDue / nextFollowUp past dates bumped
- InsuranceAuthorization, ASAMAssessments, MeasurementBasedCare, WithdrawalMonitor, ClinicalSupervision, BusinessDevelopment, TreatmentPlans

### Chart data extended to today (v3)
- Dashboard: census trend +1 point (Jul 22, census: 20)
- PopulationAnalytics: census trend +1 point (Jul 22, total: 20)

---

## What was done — v4 (this session)

### Chart/trend data extended to current week
- UADrugTesting: W4 Jul data point added (compliance: 96, positivity: 4)
- MATManagement: W4 Jul data point added (rate: 96)
- Dashboard: W4 Jul data point added (admissions: 2, discharges: 1)
- PeerSupport: Jul 20 weekly data point added (positive: 13, neutral: 2, missed: 1)

### Occupancy/table headers rolled forward
- BedManagement: Weekly occupancy table header "Jun 15 … Jul 13" → "Jun 22 … Jul 20"
- CensusBedBoard: Occupancy row week label "Jul 14" → "Jul 20"

### Census stat cards updated from 18 → 20
- CommandCenter: All 6 scorecard stats (Group Attendance, 1:1 Scheduled, UA, Tx Plans, Vitals, ASAM) updated to total: 20 with corrected pct values
- BiopsychosocialAssessment: "Assessments Completed: 18" → 20
- BusinessDevelopment: monthly census chart Jul entry 18 → 20; insight note updated to reflect recovered census
- PopulationAnalytics: dual-diagnosis denominator 24 → 20

### Discharge dates corrected
- CensusBedBoard: Marcus Webb discharge Jul 19 → Jul 22 (los 28→31); Darnell Price Jul 21 → Jul 23 (los 31→33)

### Co-sign "over" times corrected from hours to days
- CosignQueue: Three "Past Deadline" entries: "3h 14min" → "3d 14h", "1h 22min" → "3d 12h", "19h 36min" → "4d 7h"

### Stale "Unread" messages marked Read
- SecureMessaging: Two Jul 18-19 messages (3+ days old) changed from "Unread" → "Read"

---

## Decision rules for future sweeps
- "today" comparators and CURRENT_DAY must match the actual demo date (Jul 22 = Wednesday = day index 2 in Mon-0 scheme)
- Current week is Mon Jul 20 – Sun Jul 26; business week Mon Jul 20 – Fri Jul 24
- Historical clinical records (assessment timestamps, incident dates, completed lab dates, signed note dates, medication start dates, outreach logs) are NOT changed
- Time-series chart data points (trend lines before current week) are NOT changed — they are historical data
- Weekly chart series (W1/W2/W3 Jul, Jul 6/13/19 etc.) must include a current-week point
- "Over X time" elapsed counters on past-deadline items must reflect time since deadline to today (Jul 22), not original draft-to-deadline gap
- Census stat cards ("total: N", "value: N patients") must all match current census of 20
- Occupancy table headers rolling "last 5 weeks" must show weeks ending at the current Mon (Jul 20) as latest column
- Old messages >24h should be "Read" not "Unread" unless they represent an active clinical alert requiring response
