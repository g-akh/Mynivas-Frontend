# Phase 15 — Plans, Subscriptions & Feature Gating

**Status:** DONE  
**Estimated Time:** 3–4 days  
**Depends on:** Phase 12  
**Roles:** SUPER_ADMIN only (subscription management)

---

## 1. Screens
1. **Plans List** — public pricing page (no auth needed)
2. **Tenant Subscription** — current plan + change plan
3. **Feature Overrides** — grant/revoke per-tenant feature
4. **Add-ons** — activate WhatsApp/AI/Export add-ons

---

## 2. Backend Endpoints

| Action | Method | Endpoint | Auth |
|---|---|---|---|
| List plans | GET | `/v1/plans` | None (public) |
| Plan features | GET | `/v1/plans/:id/features` | None (public) |
| List add-ons | GET | `/v1/plans/add-ons` | None (public) |
| Get subscription | GET | `/v1/plans/subscriptions/:tenantId` | SUPER_ADMIN |
| Assign plan | POST | `/v1/plans/subscriptions` | SUPER_ADMIN |
| Change plan | PATCH | `/v1/plans/subscriptions/:tenantId` | SUPER_ADMIN |
| Activate add-on | POST | `/v1/plans/add-ons/subscribe` | SUPER_ADMIN |
| List overrides | GET | `/v1/plans/overrides/:tenantId` | SUPER_ADMIN |
| Grant override | POST | `/v1/plans/overrides` | SUPER_ADMIN |
| Revoke override | DELETE | `/v1/plans/overrides/:id` | SUPER_ADMIN |
| Effective features | GET | `/v1/plans/features/effective/:tenantId` | SUPER_ADMIN |

---

## 3. Plans List (Public — Shown on Login/Pricing)

**File:** `app/(app)/(admin)/plans/index.tsx`

```
┌─────────────────────────────────┐
│  Choose a Plan                  │
├─────────────────────────────────┤
│  ┌──────────┐  ┌──────────────┐ │
│  │  BASIC   │  │  STANDARD    │ │
│  │ ₹999/mo  │  │ ₹2,499/mo   │ │
│  │ 50 units │  │ 200 units    │ │
│  │ [Select] │  │ [Select]     │ │
│  └──────────┘  └──────────────┘ │
│  ┌──────────┐  ┌──────────────┐ │
│  │  PRO     │  │ ENTERPRISE   │ │
│  │ ₹4,999/mo│  │  Custom      │ │
│  │ Unlimited│  │  Contact us  │ │
│  │ [Select] │  │ [Contact]    │ │
│  └──────────┘  └──────────────┘ │
└─────────────────────────────────┘
```

Feature matrix per plan:
```
✓ = included  ✗ = not included  + = add-on

                 Basic  Std   Pro   Ent
Complaints         ✓     ✓     ✓     ✓
Visitors           ✓     ✓     ✓     ✓
Work Orders        ✗     ✓     ✓     ✓
Amenity Booking    ✗     ✗     ✓     ✓
Documents          ✗     ✗     ✓     ✓
WhatsApp           +     +     +     ✓
Analytics          ✗     ✓     ✓     ✓
Export CSV         ✗     ✗     +     ✓
AI Features        ✗     ✗     +     ✓
```

---

## 4. Tenant Subscription Screen

**File:** `app/(app)/(admin)/tenants/[id]/subscription.tsx`

```
Current Plan: PROFESSIONAL
Status: ACTIVE
Period: June 1 – June 30, 2024
Next billing: July 1, 2024

Active Add-ons:
  ✓ WhatsApp Notifications
  ✓ CSV Export

[Change Plan]  [Manage Add-ons]
```

**Change Plan bottom sheet:**
- Show all 4 plans
- Highlight current plan
- Confirm: "Change to [plan]?"
- `PATCH /v1/plans/subscriptions/:tenantId`
- Cache invalidated immediately

---

## 5. Feature Override Screen

**File:** `app/(app)/(admin)/tenants/[id]/overrides.tsx`

```
Feature Overrides for Green Valley

ACTIVE OVERRIDES:
  AI_FEATURES: ENABLED (expires Jun 30)  [Revoke]

[+ Grant Override]
  Feature Key: [AI_FEATURES ▾]
  Enable:      [YES / NO]
  Reason:      "Trial for new feature"
  Expires At:  [Never / Date picker]
  [Grant]
```

---

## 6. Feature Gating in UI

```typescript
// Use effective features to show/hide UI elements
const { data: features } = useQuery({
  queryKey: ["features", tenantId],
  queryFn: () => getEffectiveFeatures(tenantId),
  staleTime: 5 * 60_000,  // 5 min TTL matching server cache
});

// In navigation: hide tabs for unavailable features
const showAmenities = features?.AMENITIES === "true";
const showDocuments = features?.DOCUMENTS === "true";

// In screen: show upgrade prompt if feature disabled
if (!showAmenities) {
  return <UpgradePrompt feature="Amenity Booking" upgradeToHint="professional" />;
}
```

**Upgrade Prompt Component:**
```
┌─────────────────────────────────┐
│  🔒 Feature Not Available       │
│                                 │
│  Amenity Booking requires the   │
│  Professional plan or higher.   │
│                                 │
│  [View Plans]                   │
└─────────────────────────────────┘
```

---

## 7. Acceptance Criteria

| Check | Expected |
|---|---|
| Plans list loads without auth | Public endpoint, no token needed |
| Super Admin assigns plan | PATCH called, subscription updated |
| Grant temporary override | Feature enabled with expiry |
| Expired override | Feature reverts to plan default |
| PAST_DUE tenant | All features return 403, upgrade prompt shown |
| Add-on activated | WhatsApp notifications become available |
