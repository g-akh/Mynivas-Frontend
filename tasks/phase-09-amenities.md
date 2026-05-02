# Phase 09 — Amenity Booking

**Status:** DONE  
**Estimated Time:** 5–6 days  
**Depends on:** Phase 03  

---

## 1. Screens
1. **Browse Amenities** (Resident — card grid)
2. **Availability Calendar** (Resident — slot picker)
3. **Create Booking** (Resident — confirm + submit)
4. **My Bookings** (Resident — list + cancel)
5. **FM Amenities Management** (CRUD + slot management)
6. **FM Booking Approvals** (pending list + approve/reject)
7. **FM Calendar View** (all bookings across amenities)

---

## 2. Backend Endpoints

| Action | Method | Endpoint |
|---|---|---|
| List amenities | GET | `/v1/amenities?community_id=` |
| Get availability | GET | `/v1/amenities/:id/availability?from=&to=` |
| Create booking | POST | `/v1/amenities/bookings` |
| List bookings | GET | `/v1/amenities/bookings` |
| Approve booking | POST | `/v1/amenities/bookings/:id/approve` |
| Reject booking | POST | `/v1/amenities/bookings/:id/reject` |
| Cancel booking | POST | `/v1/amenities/bookings/:id/cancel` |
| Calendar view | GET | `/v1/amenities/calendar?from=&to=&community_id=` |

---

## 3. Browse Amenities (Resident)

**File:** `app/(app)/(resident)/bookings/index.tsx`

```
┌─────────────────────────────────┐
│  Book an Amenity                │
├─────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐    │
│  │   🏊     │  │   🏸     │    │
│  │ Swimming │  │Badminton │    │  ← Card grid
│  │  Pool    │  │  Court   │    │
│  │ Cap: 20  │  │  Cap: 4  │    │
│  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐    │
│  │   🏋️    │  │   🎉     │    │
│  │   Gym    │  │Clubhouse │    │
│  │ Cap: 15  │  │  Cap: 50 │    │
│  └──────────┘  └──────────┘    │
└─────────────────────────────────┘
```

**Amenity card taps → Availability Calendar**

---

## 4. Availability Calendar (Resident)

**File:** `app/(app)/(resident)/bookings/availability/[amenityId].tsx`

```
┌─────────────────────────────────┐
│  ←  Gym — Block A               │
├─────────────────────────────────┤
│  ◀  June 2024  ▶               │  ← Week/Month toggle
│  Sun Mon Tue Wed Thu Fri Sat   │
│   2   3   4   5   6   7   8   │
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ │
│  │●│ │●│ │✕│ │●│ │●│ │●│ │✕│ │  ← ● available ✕ full
│  └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ │
├─────────────────────────────────┤
│  Thursday, June 6               │
│  ┌────────────────────────────┐ │
│  │ 08:00 – 10:00  3/5 left  ✓ │ │  ← Tap to select slot
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ 10:00 – 12:00  0/5  FULL ✕ │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ 18:00 – 20:00  5/5 left  ✓ │ │
│  └────────────────────────────┘ │
├─────────────────────────────────┤
│  [Book 08:00 – 10:00, June 6]  │
└─────────────────────────────────┘
```

**Availability data:**
```typescript
// GET /v1/amenities/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
// Max 30-day range — show 2 weeks by default

interface SlotAvailability {
  date: string;
  slots: {
    slot_id: string;
    start_time: string;
    end_time: string;
    available_capacity: number;
    available: boolean;
  }[];
}
```

---

## 5. Create Booking (Resident)

**File:** `app/(app)/(resident)/bookings/confirm.tsx`

```
┌─────────────────────────────────┐
│  ←  Confirm Booking             │
├─────────────────────────────────┤
│  Gym — Block A                  │
│  Thursday, June 6, 2024         │
│  08:00 – 10:00                  │
├─────────────────────────────────┤
│  Unit ID *                      │
│  ┌──────────────────────────┐   │
│  │ A-101                    │   │  ← Pre-filled if stored
│  └──────────────────────────┘   │
│                                 │
│  Notes (optional)               │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│  [Confirm Booking]              │
└─────────────────────────────────┘
```

**Conflict error handling:**
```typescript
// 409 "Slot full"      → "This slot is fully booked. Choose another time."
// 409 "Duplicate"      → "You already have a booking for this amenity today."
// Both: highlight the unavailable slot on calendar
```

**Success states:**
- `requires_approval = false` → "Booking Confirmed! ✓" → navigate to My Bookings
- `requires_approval = true` → "Booking Request Submitted. Awaiting approval." → navigate to My Bookings

---

## 6. My Bookings (Resident)

**Tabs:** Upcoming | Past | Cancelled

**Cancel booking:**
- Disabled if date < today → tooltip "Cannot cancel past bookings"
- Disabled if status ∈ {REJECTED, CANCELLED, COMPLETED}
- On cancel: confirm dialog → `POST /v1/amenities/bookings/:id/cancel`

---

## 7. FM Booking Approvals

**File:** `app/(app)/(fm)/amenities/approvals.tsx`

```
┌─────────────────────────────────┐
│  Pending Approvals (5)          │
├─────────────────────────────────┤
│  ┌────────────────────────────┐ │
│  │ Gym • A-101 • John Kumar   │ │
│  │ June 8, 08:00–10:00        │ │
│  │ [✓ APPROVE] [✕ REJECT]    │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
```

**Reject requires reason:**
```
Bottom sheet:
"Reason for rejection (required)"
[Text input]
[Reject Booking]
```

---

## 8. FM Calendar View

**File:** `app/(app)/(fm)/amenities/calendar.tsx`

```
Week calendar grid:
- X-axis: days (Mon–Sun)
- Y-axis: amenities
- Cell: colored by booking count vs capacity
- Tap cell → booking list for that amenity+day
```

Uses: `GET /v1/amenities/calendar?from=&to=&community_id=`

---

## 9. FM Amenity Management

**File:** `app/(app)/(fm)/amenities/manage/index.tsx`

**Create Amenity Form:**
```
Name, Description, Capacity, Location, Requires Approval toggle
→ POST /v1/amenities
```

**Manage Slots (bottom sheet per amenity):**
```
Day of Week (Mon-Sun), Start Time, End Time, Max Concurrent
→ POST /v1/amenities/:id/slots
```

---

## 10. Acceptance Criteria

| Check | Expected |
|---|---|
| Available slots shown green | `available = true` → green slot |
| Full slots shown red/disabled | `available = false` → grey, not tappable |
| Create booking for full slot | 409 → error message, no navigation |
| Approval required amenity | Status shows PENDING after booking |
| FM approves booking | Status → CONFIRMED, resident notified |
| Resident cancels past booking | Button disabled with tooltip |
| FM calendar shows all bookings | GET /amenities/calendar response rendered |
