---
name: Sunrise OS auth & permission architecture
description: How login, AuthContext, RoleProvider, and permissionStore fit together; critical wiring decisions to preserve.
---

## Auth flow

1. **LoginPage** — full-screen staff card grid. Clicking a card calls `useAuth().login(staffId)`.  
2. **AuthContext** (`src/context/AuthContext.tsx`) — holds `currentStaffId` state. Exposes `currentStaff`, `isLoggedIn`, `login(staffId)`, `logout()`.  
3. **App tree**: `AuthProvider → AppWithAuth → (LoginPage | RoleProvider → AppInner)`.  
   - `AppWithAuth` reads `useAuth()` and renders `LoginPage` when `!isLoggedIn`, or `AppInner` when logged in.  
   - `RoleProvider` receives `key={currentStaff?.id ?? 'guest'}` — **critical**: the `key` forces a full remount on each new login so role state resets.  
   - `RoleProvider` also receives `defaultRoleId={currentStaff?.roleId}` and `staffId={currentStaff?.id}`.

## Permission override pattern

- `permissionStore.ts` — module-level singleton, survives navigation. Stores per-staff screen overrides, access flag overrides, and an audit log.  
- `RoleContext.getPermissionForScreen(screen)` calls `getScreenOverride(staffId, screen)` first; falls back to role default.  
- Security Admin (`security_admin` role) can read/write overrides via `StaffAdmin` page. Overrides take effect when the targeted staff member logs in next (because `RoleProvider` remounts with `staffId`).

## Topbar user menu

- Avatar shows `currentStaff.photoInitials` (or `'OS'` if no staff).  
- Click avatar → dropdown with name/title, My Settings, Role Explorer, Sign Out.  
- Sign Out calls `useAuth().logout()` which sets `currentStaffId = null` → `AppWithAuth` re-renders → `LoginPage` shows.

## StaffAdmin access control

- Only the `security_admin` role has `StaffAdmin: 'full'` permission.  
- `App.tsx` renders `<StaffAdmin />` without `withAccess()` wrapper (the component handles its own gate via Sidebar visibility).

## MOCK_STAFF backward-compat alias

- `mockStaff.ts` exports both `STAFF_MEMBERS` (primary) and `MOCK_STAFF = STAFF_MEMBERS` (alias, at end of file).  
- The alias MUST be after the `STAFF_MEMBERS` const declaration — placing it before causes "Cannot access before initialization" at runtime.

**Why:** ES module `const` bindings are not hoisted — they occupy the TDZ until the line executes.

## StaffMember shape vs old mock shape

- New `StaffMember` has `firstName`, `lastName`, `title`, `roleId`, `department` (no `.name` or `.role`).  
- Any page that maps over staff must use `${s.firstName} ${s.lastName}` for display name, and `s.title` for role label.
