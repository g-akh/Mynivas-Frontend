# Phase 06 — Visitor Management & Gate

**Status:** DONE  
**Estimated Time:** 5–6 days  
**Depends on:** Phase 03  

---

## 1. Screens
1. **Resident: Pre-register Visitor** — create visitor pass + QR code
2. **Resident: My Visitor Passes** — list of passes + history
3. **Guard: Gate Dashboard** — active visitors + check-in/out
4. **Guard: New Walk-in** — log walk-in visitor
5. **Guard: Visitor Detail** — approve/reject + QR scan
6. **FM: Visitor Log** — all visitors + block management

---

## 2. Backend Endpoints

| Action | Method | Endpoint |
|---|---|---|
| Create visitor pass | POST | `/v1/visitor-passes` |
| List visitors | GET | `/v1/visitors` |
| Create walk-in visitor | POST | `/v1/visitors` |
| Update visitor status | PATCH | `/v1/visitors/:id` |
| List blocked visitors | GET | `/v1/blocked-visitors` |
| Block a visitor | POST | `/v1/blocked-visitors` |

---

## 3. Screen Specifications

### 3.1 Pre-register Visitor (Resident)

**File:** `app/(app)/(resident)/visitors/new.tsx`

```
┌─────────────────────────────────┐
│  ←  Pre-register Visitor        │
├─────────────────────────────────┤
│  Visitor Name *                 │
│  ┌──────────────────────────┐   │
│  │ John Smith               │   │
│  └──────────────────────────┘   │
│                                 │
│  Expected Arrival *             │
│  ┌──────────────────────────┐   │
│  │ 📅 Jun 15, 2024 2:00 PM  │   │  ← DateTimePicker
│  └──────────────────────────┘   │
│                                 │
│  Pass Valid Until *             │
│  ┌──────────────────────────┐   │
│  │ 📅 Jun 15, 2024 8:00 PM  │   │  ← Max 7 days from arrival
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │    Generate Pass         │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

**Validation:**
```typescript
const visitorPassSchema = z.object({
  visitorName: z.string().min(2, "Name required"),
  expectedAt: z.date().min(new Date(), "Must be in the future"),
  expiresAt: z.date(),
}).refine(data => {
  const maxExpiry = new Date(data.expectedAt);
  maxExpiry.setDate(maxExpiry.getDate() + 7);
  return data.expiresAt <= maxExpiry;
}, "Pass cannot exceed 7 days");
```

**On Success → Show QR Code Screen:**
```
┌─────────────────────────────────┐
│  ←  Visitor Pass Created        │
├─────────────────────────────────┤
│         ┌──────────┐            │
│         │          │            │
│         │  QR Code │            │  ← QR containing passId
│         │          │            │
│         └──────────┘            │
│                                 │
│  Share with John Smith          │
│  Valid: Jun 15, 2:00–8:00 PM   │
│                                 │
│  [📤 Share via WhatsApp]        │
│  [📋 Copy Link]                 │
└─────────────────────────────────┘
```

QR generation: `react-native-qrcode-svg`
Content: `mynivas://visitors/pass/{passId}`

---

### 3.2 My Visitor Passes (Resident)

**File:** `app/(app)/(resident)/visitors/index.tsx`

**Tabs:** Upcoming | Today | Past

Each pass card shows:
- Visitor name
- Expected time
- Status badge (PENDING_APPROVAL / APPROVED / CHECKED_IN / CHECKED_OUT)
- Tap → pass detail with QR

---

### 3.3 Gate Dashboard (Guard)

**File:** `app/(app)/(guard)/gate.tsx`

```
┌─────────────────────────────────┐
│  Gate — Green Valley    [🔍]   │
├─────────────────────────────────┤
│  [📷 Scan QR]  [+ Walk-in]     │  ← Primary actions
├─────────────────────────────────┤
│  ⏳ PENDING APPROVAL (3)        │
│  ┌────────────────────────────┐ │
│  │ 👤 John Smith (GUEST)      │ │
│  │ A-101 • Expected now       │ │
│  │ [APPROVE] [REJECT]         │ │
│  └────────────────────────────┘ │
├─────────────────────────────────┤
│  ✅ CHECKED IN (8)              │
│  ┌────────────────────────────┐ │
│  │ 👤 Courier (Swiggy)        │ │
│  │ B-204 • In since 2:30 PM   │ │
│  │ [CHECK OUT]                │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
```

**Auto-refresh:** 30 seconds (guard needs live updates)

**Approve visitor:**
```typescript
const { mutate: approve } = useMutation({
  mutationFn: (id: string) => updateVisitor(id, { status: "APPROVED" }),
  onSuccess: () => {
    queryClient.invalidateQueries(["visitors"]);
    showToast({ type: "success", message: "Visitor approved. Gate can open." });
  },
});
```

**Blocked visitor alert:**
```typescript
// Before creating walk-in or approving:
// Check if visitor phone matches any blocked_visitors entry
// If match → show RED ALERT banner
// "⚠️ This visitor is on the blocked list! Reason: [reason]"
// Force guard to confirm before proceeding
```

---

### 3.4 New Walk-in (Guard)

**File:** `app/(app)/(guard)/new-visitor.tsx`

```
Fields:
- visitorName (required)
- visitorPhone (optional)
- visitorType: [GUEST] [COURIER] [SERVICE] [VENDOR]  ← Radio buttons
- unitId: searchable unit selector

API: POST /v1/visitors
```

**Blocked visitor check** — after entering phone:
```typescript
// Client-side check against cached blocked list
const { data: blocked } = useQuery({
  queryKey: ["blocked-visitors"],
  queryFn: getBlockedVisitors,
  staleTime: 5 * 60_000,
});

const isBlocked = blocked?.some(b => b.visitor_phone === phone);
if (isBlocked) showBlockedAlert(blocked.find(b => b.visitor_phone === phone));
```

---

### 3.5 QR Scan (Guard)

**File:** `app/(app)/(guard)/scan.tsx`

```typescript
// Uses expo-camera to scan QR codes
// Parsed QR: mynivas://visitors/pass/{passId}
// → fetch visitor pass details
// → show visitor info
// → confirm CHECK IN button
```

---

### 3.6 FM Visitor Log

**File:** `app/(app)/(fm)/visitors/index.tsx`

**Tabs:** Today | This Week | Blocked List

**Block Visitor Form (bottom sheet):**
```typescript
// POST /v1/blocked-visitors
{ tenantId, communityId, visitorName, visitorPhone?, reason? }
```

---

## 4. Acceptance Criteria

| Check | Expected |
|---|---|
| Resident creates pass | QR code generated and shareable |
| Guard scans QR | Visitor info shown with approve/reject |
| Guard approves | Status → APPROVED, disappears from pending |
| Guard checks out | Status → CHECKED_OUT, timer shown |
| Walk-in with blocked phone | Red alert shown, guard must confirm |
| FM blocks visitor | Entry added to blocked list |
| 30s polling on gate | Gate list updates without manual refresh |
