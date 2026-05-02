# Phase 07 — Announcements & Polls (FM/Admin Create)

**Status:** TODO  
**Estimated Time:** 3–4 days  
**Depends on:** Phase 03  

---

## 1. Screens
1. **Announcement List** (FM — all announcements with status)
2. **Create Announcement** (FM — multi-step wizard)
3. **Create Poll** (FM — attach poll to announcement)
4. **Announcement Detail** (FM — delivery stats, recipient list)
5. **Poll Results** (FM — bar chart + voter list)

---

## 2. Backend Endpoints

| Action | Method | Endpoint |
|---|---|---|
| List announcements | GET | `/v1/announcements` |
| Create announcement | POST | `/v1/announcements` |
| Update announcement | PATCH | `/v1/announcements/:id` |
| Add recipients | POST | `/v1/announcements/:id/recipients` |
| Create poll | POST | `/v1/announcements/:id/polls` |

---

## 3. Create Announcement Wizard (FM)

**File:** `app/(app)/(fm)/announcements/new.tsx`

**Step 1 — Content:**
```
Title *           (max 100 chars with counter)
Body *            (rich text / textarea, max 2000 chars)
Priority *        [NORMAL] [● IMPORTANT] [EMERGENCY]
Type *            [NOTICE] [POLL] [EMERGENCY]
```

**Step 2 — Audience:**
```
Audience Scope *  [ALL] [BUILDING] [FLOOR] [UNITS]
  → if BUILDING: building selector
  → if FLOOR:    building + floor number
  → if UNITS:    multi-select unit picker
```

**Step 3 — Poll (conditional, if type = POLL):**
```
Poll Options *    [+ Add Option] (min 2, max 6)
  ┌──────────────────────────────────┐
  │ Option 1: Yes                    │ [✕]
  │ Option 2: No                     │ [✕]
  │ [+ Add Option]                   │
  └──────────────────────────────────┘
Deadline *        DateTimePicker (future only)
```

**Step 4 — Preview & Send:**
```
Preview card of announcement
[Save as Draft]   [Send Now]
```

**API Calls:**
```typescript
// Step 1: Create announcement
const ann = await createAnnouncement({
  title, body, priority, type,
  audienceScope, tenantId, communityId
});

// Step 2: If poll, add it
if (type === "POLL") {
  await createPoll(ann.id, { options, deadline });
}

// (Recipients are resolved server-side by audienceScope)
```

---

## 4. Announcement Delivery Stats (FM Detail)

```
┌─────────────────────────────────┐
│  Delivery: 245/250 (98%)        │
│  ████████████████████░░         │
│  Read:     180/245  (73%)       │
│  ████████████████░░░░           │
│  Acknowledged: 120/180 (67%)    │  ← Only for required_ack=true
│  ████████████░░░░░░░            │
└─────────────────────────────────┘
```

---

## 5. Acceptance Criteria

| Check | Expected |
|---|---|
| FM creates NOTICE | POST called, appears in list with DRAFT status |
| FM sends announcement | Status → SENT, delivery stats start updating |
| EMERGENCY announcement | Pinned at top for all residents |
| Poll options validated | Min 2 required, max 6 allowed |
| Poll deadline in past | Validation error shown |
| Resident feed updates | New announcements appear after FM sends |
