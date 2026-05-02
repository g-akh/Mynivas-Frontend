# Phase 12 — Admin Panel (Super Admin + Tenant Admin + Community Admin)

**Status:** TODO  
**Estimated Time:** 6–7 days  
**Depends on:** Phase 03  

---

## 1. Screens

**Super Admin screens:**
1. **Tenant List** — create/edit tenants
2. **Tenant Detail** — tenant policies, subscription

**Tenant Admin screens:**
3. **Communities List** — manage communities
4. **Community Detail** — buildings, units

**Community Admin screens:**
5. **Users List** — all users, invite, assign roles
6. **User Detail** — edit user, change role, assign unit
7. **Onboarding** — new tenant+community wizard
8. **Audit Logs** — activity history

---

## 2. Backend Endpoints

| Action | Method | Endpoint | Roles |
|---|---|---|---|
| List tenants | GET | `/v1/tenants` | SUPER_ADMIN |
| Create tenant | POST | `/v1/tenants` | SUPER_ADMIN |
| Update tenant | PATCH | `/v1/tenants/:id` | SUPER_ADMIN |
| List communities | GET | `/v1/communities` | SUPER_ADMIN, TENANT_ADMIN |
| Create community | POST | `/v1/communities` | SUPER_ADMIN |
| Update community | PATCH | `/v1/communities/:id` | SUPER_ADMIN, COMMUNITY_ADMIN |
| Add building | POST | `/v1/communities/:id/buildings` | COMMUNITY_ADMIN |
| Add unit | POST | `/v1/communities/:id/units` | COMMUNITY_ADMIN |
| List users | GET | `/v1/users` | COMMUNITY_ADMIN, FM |
| Create user | POST | `/v1/users` | COMMUNITY_ADMIN |
| Update user | PATCH | `/v1/users/:id` | COMMUNITY_ADMIN |
| Assign role | POST | `/v1/users/:id/roles` | COMMUNITY_ADMIN |
| Assign unit | POST | `/v1/users/:id/units` | COMMUNITY_ADMIN |
| Onboard tenant | POST | `/v1/onboarding/communities` | SUPER_ADMIN |
| List onboarding | GET | `/v1/onboarding` | SUPER_ADMIN |
| Auth audit | GET | `/v1/auth/audit` | SUPER_ADMIN |

---

## 3. Tenant List Screen (Super Admin)

**File:** `app/(app)/(admin)/tenants/index.tsx`

```
┌─────────────────────────────────┐
│  Tenants (12)          [+ New]  │
├─────────────────────────────────┤
│  [🔍 Search tenants...]         │
├─────────────────────────────────┤
│  ┌────────────────────────────┐ │
│  │ Green Valley Society       │ │
│  │ [ACTIVE]   5 communities   │ │
│  │ Created: Jan 2024   [→]    │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ Sunrise Apartments         │ │
│  │ [SUSPENDED]  2 communities │ │
│  │ Created: Mar 2024   [→]    │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
```

**Create Tenant Bottom Sheet:**
```
Name * (text input)
Status: [ACTIVE ▾]
[Create Tenant]
```

---

## 4. Onboarding Wizard (Super Admin)

**File:** `app/(app)/(admin)/onboarding/new.tsx`

3-step wizard (same as web spec, adapted for mobile):

**Step 1: Tenant** → Name + Status  
**Step 2: Community** → Name + Timezone + Address  
**Step 3: Admin User** → Name + Phone (E.164) + Email (optional)

Header: `X-Idempotency-Key: {uuid}` (generated on mount)

**Progress screen after submit:**
```
Provisioning your community...
✓ Tenant created
✓ Community created
✓ Admin user created
⟳ Sending welcome message...
```

Poll `GET /v1/onboarding/:id` every 2 seconds until status = COMPLETED or FAILED.

---

## 5. Users List (Community Admin)

**File:** `app/(app)/(admin)/users/index.tsx`

```
┌─────────────────────────────────┐
│  Users (48)             [+ Invite]│
├─────────────────────────────────┤
│  [All] [Residents] [Staff]      │
│  [🔍 Search...]                 │
├─────────────────────────────────┤
│  Rahul Kumar                    │
│  +91 9876543210 • A-101         │
│  [RESIDENT] [ACTIVE]            │
│  ─────────────────────────────  │
│  John (Technician)              │
│  +91 9999999999                 │
│  [TECHNICIAN] [ACTIVE]          │
└─────────────────────────────────┘
```

**Invite User (bottom sheet):**
```
Phone * (E.164)
Name
Role: [RESIDENT ▾] (role options by current user's permission)
→ POST /v1/users
```

**Tap user → User Detail:**
- Edit name, phone, status
- Change role → POST /v1/users/:id/roles
- Assign unit (residents) → POST /v1/users/:id/units

---

## 6. Community Setup (Community Admin)

**File:** `app/(app)/(admin)/community/index.tsx`

**Tabs:** Info | Buildings & Units | Settings

**Buildings & Units tree:**
```
Building A  [+ Add Unit]
  ├ 101
  ├ 102  
  └ 103
Building B  [+ Add Unit]
  └ 201
[+ Add Building]
```

---

## 7. Audit Logs Screen

**File:** `app/(app)/(admin)/audit/index.tsx`

```
┌─────────────────────────────────┐
│  Audit Logs             [Filter]│
├─────────────────────────────────┤
│  ● Rahul Kumar              3m  │
│    Uploaded "Bylaws 2024.pdf"   │
│  ─────────────────────────────  │
│  ● John (FM)               15m  │
│    Approved booking BK-042      │
│  ─────────────────────────────  │
│  ● System                   1h  │
│    2 documents expired          │
│  Load more...                   │
└─────────────────────────────────┘
```

Filter options: entity type, date range, actor

---

## 8. Acceptance Criteria

| Check | Expected |
|---|---|
| SUPER_ADMIN logs in | Sees Tenants tab |
| TENANT_ADMIN logs in | Sees Communities (not Tenants) |
| COMMUNITY_ADMIN logs in | Sees Users + Community |
| Onboarding wizard completes | Tenant + community created, progress shown |
| Invite user with role=RESIDENT | POST called, user appears in list |
| Assign unit to resident | POST /users/:id/units called |
| Audit log paginated | "Load more" fetches next page |
