# Phase 4 Scheduling — Permission Contract
## Branch: feature/phase-4-scheduling-and-appointments
## Status: PROPOSED — awaiting approval before implementation

---

## Proposed Permission Codes

```
appointment.create
appointment.view
appointment.edit
appointment.cancel
appointment.view_facility_schedule
```

Five scheduling-specific codes. No existing permission is reused. No broad admin permission grants scheduling access.

---

## Permission Definitions

### `appointment.create`
Create a new appointment for an existing patient.

- **Facility boundary:** Yes — the acting user must be assigned at the patient's facility
- **Organization boundary:** Yes — enforced via `org_id` on the appointment
- **Patient access:** Yes — an active `sos_patient_access` row (or facilityWide role) is required
- **Ownership:** N/A on create — the creator becomes `created_by_user_id`
- **Denied roles:** `billing_user`, `hr_user`, `security_admin`, `bht`, `aftercare_staff`

### `appointment.view`
Read a single appointment or a patient's appointment list.

- **Facility boundary:** Yes — user must be at the patient's facility
- **Organization boundary:** Yes
- **Patient access:** Yes — same rules as clinical note view
- **Ownership:** No — any authorized staff at the facility may view
- **Denied roles:** `billing_user`, `hr_user`, `security_admin`

### `appointment.edit`
Edit an existing future appointment (any editable field).

- **Facility boundary:** Yes
- **Organization boundary:** Yes
- **Patient access:** Yes
- **Ownership:** `clinical_supervisor` may edit any appointment at the facility; all other roles may only edit appointments they created (`created_by_user_id = acting_user_id`)
- **Editable when:** status is `scheduled` or `confirmed`; `cancelled` and `completed` appointments are not editable
- **Denied roles:** `billing_user`, `hr_user`, `security_admin`, `bht`, `aftercare_staff`

### `appointment.cancel`
Cancel an appointment with a required reason.

- **Facility boundary:** Yes
- **Organization boundary:** Yes
- **Patient access:** Yes
- **Ownership:** `clinical_supervisor` may cancel any appointment; other roles may only cancel appointments they created
- **Cancellable when:** status is `scheduled` or `confirmed`; already-cancelled appointments return 409
- **Denied roles:** `billing_user`, `hr_user`, `security_admin`, `bht`, `aftercare_staff`

### `appointment.view_facility_schedule`
View the full appointment schedule for a facility across all patients and staff (not limited to the user's own patients).

- **Facility boundary:** Yes — scoped to the facility of the grant
- **Organization boundary:** Yes
- **Patient access:** Not required per-patient — this is an aggregate view; individual appointment detail still requires patient access to be returned in full
- **Ownership:** No
- **Denied roles:** `billing_user`, `hr_user`, `security_admin`, `bht`, `aftercare_staff`

---

## Role Matrix

| Role | create | view | edit | cancel | view_facility_schedule |
|---|---|---|---|---|---|
| `clinical_supervisor` | ✓ | ✓ | ✓ (any) | ✓ (any) | ✓ |
| `certified_clinician` | ✓ | ✓ | ✓ (own) | ✓ (own) | ✓ |
| `mh_therapist` | ✓ | ✓ | ✓ (own) | ✓ (own) | ✓ |
| `prescriber` | ✓ | ✓ | ✓ (own) | ✓ (own) | ✓ |
| `nursing` | ✓ | ✓ | ✓ (own) | ✓ (own) | ✓ |
| `bht` | ✗ | ✓ | ✗ | ✗ | ✗ |
| `aftercare_staff` | ✗ | ✓ | ✗ | ✗ | ✗ |
| `billing_user` | ✗ | ✗ | ✗ | ✗ | ✗ |
| `hr_user` | ✗ | ✗ | ✗ | ✗ | ✗ |
| `security_admin` | ✗ | ✗ | ✗ | ✗ | ✗ |

"own" = `created_by_user_id = acting_user_id`

---

## Facility Boundary Behavior

All scheduling operations are scoped to the acting user's facility grant.

- The `facility_id` on the appointment must match a facility where the acting user holds an active scheduling permission.
- A user with grants at multiple facilities may create/view/edit appointments only within each respective facility.
- Cross-facility access (e.g., acting user at Facility A accessing an appointment for a patient at Facility B) returns `403`.
- `appointment.view_facility_schedule` is scoped per-facility; a user must hold the permission for the specific facility being queried.

---

## Organization Boundary Behavior

- `org_id` is derived from the session (`req.orgId`). It is never accepted from the request body.
- Any appointment whose `org_id` does not match the session org returns `404` (not `403`) — consistent with the existing security model (no information leakage about cross-tenant resources).

---

## Patient Access Requirements

- `appointment.create`, `appointment.view`, `appointment.edit`, `appointment.cancel` all require the acting user to have patient access.
- Patient access check: active `sos_patient_access` row OR `facilityWide = true` for the user's role at the patient's facility.
- Unassigned patient (no `sos_patient_access`, non-facilityWide role): `403`.

---

## Denied Role Enforcement

Denials are enforced at the authorization service layer (server-side), not only by hiding UI buttons.

`billing_user`, `hr_user`, and `security_admin` have no scheduling permissions in `ROLE_PERMISSIONS`. A request from these roles hits the authorization check and fails before touching any appointment data.

Denial events are written to `sos_audit_outbox` → `sos_auth_audit` with `event_type = 'authorization_denied'`.

---

## Unapproved Permissions (must remain absent)

The following codes must NOT appear in the Phase 4 implementation:

```
appointment.sign
appointment.export
appointment.audit_view
appointment.admin
appointment.bulk_edit
appointment.delete
```

Hard deletes are not implemented. Appointments are cancelled, not deleted.

---

## permissionPolicy.ts Changes Required

Phase 4 will add five new codes to `PERMISSION_CODES` and update `ROLE_PERMISSIONS` for each qualifying role. The frontend `permissions.ts` must be updated in sync with the server-side policy.

Migration `0007_scheduling_and_appointments.sql` will also add scheduling `event_type` values to the `ck_sos_auth_audit_event_type` constraint allowlist.
