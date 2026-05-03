# Phase 08 — Work Orders & PPM

**Status:** DONE  
**Estimated Time:** 4–5 days  
**Depends on:** Phase 03  

---

## 1. Screens
1. **Work Orders List** (FM — all, Technician — assigned only)
2. **New Work Order** (FM creates)
3. **Work Order Detail** (with status stepper + technician actions)
4. **Resident Rating** (after COMPLETED)
5. **PPM Assets List** (FM)
6. **PPM Schedules** (FM — with overdue indicators)

---

## 2. Backend Endpoints

| Action | Method | Endpoint |
|---|---|---|
| List work orders | GET | `/v1/work-orders` |
| Create work order | POST | `/v1/work-orders` |
| Update work order | PATCH | `/v1/work-orders/:id` |
| Rate work order | POST | `/v1/work-orders/:id/ratings` |
| List assets | GET | `/v1/ppm/assets` |
| Create asset | POST | `/v1/ppm/assets` |
| List schedules | GET | `/v1/ppm/ppm-schedules` |
| Create schedule | POST | `/v1/ppm/ppm-schedules` |

---

## 3. Work Order Status Stepper

```
OPEN → ASSIGNED → IN_PROGRESS → BLOCKED → COMPLETED

●────●────○────○────○
```

**Technician actions (role-gated):**
- Status = ASSIGNED: [Start Work] → `{ status: "IN_PROGRESS" }`
- Status = IN_PROGRESS: [Mark Blocked] | [Mark Complete]
- Status = BLOCKED: [Resume] → `{ status: "IN_PROGRESS" }`

**FM actions:**
- OPEN: [Assign Technician] → opens search modal
- Any status: [Change Priority]

---

## 4. Work Order Detail Screen

**File:** `app/(app)/work-orders/[id].tsx`

```
┌─────────────────────────────────┐
│  ←  Work Order #WO-2024-0042   │
├─────────────────────────────────┤
│  [PPM] 🔴 HIGH                  │  ← Type badge + Priority
│  Elevator Maintenance           │
│  Asset: Elevator Block A        │
├─────────────────────────────────┤
│  ●──●──●──○──○                  │  ← Status stepper
│  OPEN ASS IN_P — COMP           │
├─────────────────────────────────┤
│  Assigned to: John (Technician) │
│  Started: June 10, 2024         │
├─────────────────────────────────┤
│  [Mark Complete] [Mark Blocked] │  ← Technician only
└─────────────────────────────────┘
```

---

## 5. Resident Rating Screen

**File:** `app/(app)/(resident)/complaints/rate/[id].tsx`  
Shown after work order status = COMPLETED for linked complaint.

```
┌─────────────────────────────────┐
│  Rate the Resolution            │
│                                 │
│  How was your experience?       │
│                                 │
│     ⭐ ⭐ ⭐ ⭐ ⭐               │  ← Star selector (1-5)
│                                 │
│  Feedback (optional)            │
│  ┌──────────────────────────┐   │
│  │ Great service...         │   │
│  └──────────────────────────┘   │
│                                 │
│  [Submit Rating]                │
└─────────────────────────────────┘
```

---

## 6. PPM Schedules Screen

**File:** `app/(app)/(fm)/ppm/index.tsx`

**Tabs:** Assets | Schedules

**Schedule card:**
```
┌────────────────────────────────┐
│ 🔴 OVERDUE  Elevator Block A   │  ← Red for overdue
│ MONTHLY  Next due: May 28      │
│ (3 days overdue)               │
└────────────────────────────────┘
```

---

## 7. Acceptance Criteria

| Check | Expected |
|---|---|
| FM creates PPM work order | POST with type=PPM, asset linked |
| Technician sees only assigned | My assigned orders only visible |
| Technician marks complete | PATCH called, status updates |
| Resident rates after completion | POST /ratings called |
| PPM overdue indicator | Red card for past-due schedules |
| New work order linked to complaint | type=COMPLAINT with complaint reference |
