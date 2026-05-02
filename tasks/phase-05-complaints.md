# Phase 05 — Complaints / Helpdesk

**Status:** TODO  
**Estimated Time:** 4–5 days  
**Depends on:** Phase 03  

---

## 1. Screens
1. **Complaints List** — Resident (my tickets) + FM (all tickets with filters)
2. **New Complaint** — Resident creates ticket
3. **Complaint Detail** — View + status updates
4. **FM Complaint Board** — Kanban-style status columns (FM only)
5. **Assign Complaint** — FM assigns to technician

---

## 2. Backend Endpoints

| Action | Method | Endpoint |
|---|---|---|
| List complaints | GET | `/v1/complaints` |
| Create complaint | POST | `/v1/complaints` |
| Get complaint | GET | `/v1/complaints/:ticketId` |
| Update complaint | PATCH | `/v1/complaints/:ticketId` |

---

## 3. API Service (`src/api/complaints.ts`)

```typescript
export interface Complaint {
  id: string;
  community_id: string;
  unit_id: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  description: string;
  created_by: string;
  assigned_to: string | null;
  sla_due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateComplaintInput {
  tenantId: string;
  communityId: string;
  unitId: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
}

export async function listComplaints(): Promise<Complaint[]> {
  const { data } = await apiClient.get("/v1/complaints");
  return data.complaints ?? data;
}

export async function getComplaint(id: string): Promise<Complaint> {
  const { data } = await apiClient.get(`/v1/complaints/${id}`);
  return data;
}

export async function createComplaint(input: CreateComplaintInput): Promise<Complaint> {
  const { data } = await apiClient.post("/v1/complaints", input);
  return data;
}

export async function updateComplaint(
  id: string,
  patch: Partial<{ status: string; priority: string; assigned_to: string; description: string }>
): Promise<Complaint> {
  const { data } = await apiClient.patch(`/v1/complaints/${id}`, patch);
  return data;
}
```

---

## 4. Screen Specifications

### 4.1 Complaints List (Resident View)

**File:** `app/(app)/(resident)/complaints/index.tsx`

```
┌─────────────────────────────────┐
│  My Complaints        [+]       │
├─────────────────────────────────┤
│  [All] [Open] [Resolved]        │  ← Filter tabs
├─────────────────────────────────┤
│  ┌────────────────────────────┐ │
│  │ 🔴 HIGH  • Plumbing        │ │
│  │ Water leak in bathroom     │ │
│  │ [IN PROGRESS]  3 days ago  │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ 🟡 MEDIUM • Electrical     │ │
│  │ Fan not working in bedroom │ │
│  │ [NEW]          1 day ago   │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ 🟢 LOW  • Housekeeping     │ │
│  │ Corridor not cleaned       │ │
│  │ [RESOLVED]     1 week ago  │ │
│  └────────────────────────────┘ │
│          Load more...           │
└─────────────────────────────────┘
```

**Complaint Card:**
- Priority dot color (red/amber/green/grey)
- Category + description preview (2 lines truncated)
- Status badge (colored)
- Relative time ("3 days ago")
- Tap → navigate to detail

---

### 4.2 New Complaint Screen (Resident)

**File:** `app/(app)/(resident)/complaints/new.tsx`

```
┌─────────────────────────────────┐
│  ←  Raise a Complaint           │
├─────────────────────────────────┤
│  Category *                     │
│  ┌──────────────────────────┐   │
│  │ Plumbing              ▾  │   │  ← Bottom sheet picker
│  └──────────────────────────┘   │
│                                 │
│  Priority *                     │
│  [LOW] [● MEDIUM] [HIGH] [CRIT] │  ← Radio buttons with colors
│                                 │
│  Description *                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │  Describe the issue...   │   │  ← TextArea (min 20 chars)
│  │                          │   │
│  └──────────────────────────┘   │
│  Min 20 characters (0/1000)     │
│                                 │
│  ┌──────────────────────────┐   │
│  │    Submit Complaint      │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

**Form Fields:**
| Field | Type | Validation | Backend param |
|---|---|---|---|
| category | Picker | Required | `category` |
| priority | Radio | Required, default MEDIUM | `priority` |
| description | TextArea | Required, min 20 chars | `description` |

**Categories list** (static, no API needed):
`["Plumbing", "Electrical", "Civil/Structure", "Housekeeping", "Security", "Elevator/Lift", "Parking", "Water Supply", "Internet/Cable", "Common Area", "Other"]`

**On Submit:**
```typescript
const { mutate, isPending } = useMutation({
  mutationFn: () => createComplaint({
    tenantId: user.tenantId,
    communityId: user.communityId,
    unitId: myUnitId,           // fetched from user profile
    category,
    priority,
    description,
  }),
  onSuccess: (complaint) => {
    queryClient.invalidateQueries(["complaints"]);
    router.replace(`/(app)/(resident)/complaints/${complaint.id}`);
    showToast({ type: "success", message: "Complaint raised successfully" });
  },
  onError: (error) => {
    applyServerErrors(getFieldErrors(error), setError);
    showToast({ type: "error", message: getErrorMessage(error) });
  },
});
```

---

### 4.3 Complaint Detail Screen

**File:** `app/(app)/complaints/[id].tsx` (shared between resident + FM)

```
┌─────────────────────────────────┐
│  ←  Complaint #COMP-0042        │
├─────────────────────────────────┤
│  🔴 HIGH PRIORITY               │
│  Plumbing — Water leak          │
│  Unit A-101 • Raised 3 days ago │
├─────────────────────────────────┤
│  Status Progress:               │
│  ●──●──○──○──○                  │
│  NEW ASSIGNED — — RESOLVED CLOSED │
├─────────────────────────────────┤
│  Description:                   │
│  "There is a water leak in the  │
│   bathroom that started 3 days  │
│   ago..."                       │
├─────────────────────────────────┤
│  Assigned to: Technician John   │  ← null shows "Unassigned"
│  SLA Due: June 15 (2 days left) │  ← red if overdue
├─────────────────────────────────┤
│  ─── Activity Timeline ───      │
│  ● Complaint raised  (3d ago)   │
│  ● Assigned to John  (2d ago)   │
│  ● Status: IN_PROGRESS (1d ago) │
├─────────────────────────────────┤
│  [Rate Resolution] (if RESOLVED)│  ← Resident only, 1-5 stars
└─────────────────────────────────┘
```

**FM-only action buttons (shown if role = FM/COMMUNITY_ADMIN):**
```
[Assign Technician]  [Change Priority]  [Update Status]
```

---

### 4.4 FM Complaints List

**File:** `app/(app)/(fm)/complaints/index.tsx`

**Filter Bar:**
```
┌─────────────────────────────────┐
│  Complaints          [≡ Filter] │
├─────────────────────────────────┤
│  [🔍 Search...]                 │
│  Status: [All▾]  Priority: [All▾] │
│  Category: [All▾]  Date: [30d▾] │
├─────────────────────────────────┤
│  47 complaints found            │
│  (Complaint list items)         │
└─────────────────────────────────┘
```

**FM actions on complaint card (swipe left to reveal):**
- `Assign` → opens assign modal
- `Close` → confirm dialog

---

### 4.5 Assign Complaint (FM)

**File:** `app/(app)/(fm)/complaints/assign/[id].tsx`

Bottom sheet with:
- Search technicians list
- `PATCH /v1/complaints/:id` with `{ assigned_to: technicianId, status: "ASSIGNED" }`

---

## 5. Validation Rules

```typescript
const complaintSchema = z.object({
  category: z.string().min(1, "Category is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
});
```

---

## 6. Acceptance Criteria

| Check | Expected |
|---|---|
| Resident creates complaint | Form validates, POST called, redirects to detail |
| Description < 20 chars | Inline error shown, submit disabled |
| FM views all complaints | Full list with filters working |
| FM assigns technician | PATCH called, status changes to ASSIGNED |
| Status progress bar | Correct step highlighted |
| SLA past due | Date shown in red |
| Empty state | "No complaints yet" illustration shown |
