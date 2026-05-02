# Phase 04 — Home Screen & FM Dashboard

**Status:** TODO  
**Estimated Time:** 4–5 days  
**Depends on:** Phase 03  
**Blocks:** None (parallel with Phase 05+)

---

## 1. Phase Overview

### Screens
1. **Resident Home** — announcement feed + quick action cards
2. **FM Dashboard** — 8 KPI cards + quick action buttons
3. **Announcement Detail** — full announcement + poll voting

### Backend Endpoints

| Screen | Method | Endpoint |
|---|---|---|
| FM Dashboard | GET | `/v1/reports/dashboard?community_id=` |
| Announcements list | GET | `/v1/announcements` |
| Single announcement | GET | `/v1/announcements/:id` |
| Acknowledge announcement | POST | `/v1/announcements/:id/ack` |
| Vote on poll | POST | `/v1/announcements/polls/:pollId/votes` |

---

## 2. FM Dashboard Screen

**File:** `app/(app)/(fm)/dashboard.tsx`  
**Roles:** `FM`, `COMMUNITY_ADMIN`  
**Auto-refresh:** 60 seconds (polling)

### API Response Shape
```typescript
interface DashboardData {
  complaints: { open_count: number; breaching_sla_count: number };
  visitors: { pending_approval_count: number; currently_checked_in_count: number };
  work_orders: { unassigned_count: number; blocked_count: number };
  ppm: { overdue_count: number };
  announcements: { pending_ack_count: number };
}
```

### UI Layout
```
┌─────────────────────────────────┐
│  Good Morning, Rahul    🔔      │  ← Header with greeting + bell
│  Green Valley Society           │
├─────────────────────────────────┤
│  Last updated: 2 min ago   ⟳   │  ← Refresh indicator
├────────────┬────────────────────┤
│ 🔴 12      │  🟡 3              │
│ Open       │  SLA Breaching     │  ← KPI card row 1
│ Complaints │  Complaints        │
├────────────┼────────────────────┤
│ 🟡 5       │  🟢 8              │
│ Pending    │  Checked In        │  ← KPI card row 2
│ Visitors   │  Visitors          │
├────────────┼────────────────────┤
│ 🔴 7       │  🔴 2              │
│ Unassigned │  Blocked           │  ← KPI card row 3
│ Work Orders│  Work Orders       │
├────────────┼────────────────────┤
│ 🔴 3       │  🟡 15             │
│ PPM        │  Pending           │  ← KPI card row 4
│ Overdue    │  Acknowledgements  │
├─────────────────────────────────┤
│         Quick Actions           │
│  [+ Complaint] [Log Visitor]    │
│  [+ Work Order] [Announce]      │
└─────────────────────────────────┘
```

### KPI Card Component (`src/components/dashboard/KPICard.tsx`)
```typescript
interface KPICardProps {
  label: string;
  value: number;
  icon: string;            // MaterialIcons name
  urgentThreshold?: number; // Shows red when value >= threshold
  onPress: () => void;     // Navigate to relevant list screen
}
// urgent=true → red border + pulsing animation
// urgent=false → standard card
```

### KPI Urgency Rules
| Metric | Urgent when |
|---|---|
| Open Complaints | ≥ 5 |
| SLA Breaching | ≥ 1 |
| Pending Visitor Approvals | ≥ 1 |
| Unassigned Work Orders | ≥ 3 |
| Blocked Work Orders | ≥ 1 |
| PPM Overdue | ≥ 1 |

### States
- **Loading:** 8 skeleton cards (grey shimmer)
- **Error:** "Could not load dashboard. Tap to retry."
- **Success:** Live data with last-updated timestamp
- **Stale (> 3 min):** Show "Data may be stale" warning banner

### Polling
```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["dashboard", communityId],
  queryFn: () => getDashboard(communityId),
  refetchInterval: 60_000,        // poll every 60s
  staleTime: 30_000,
});
```

---

## 3. Resident Home Screen

**File:** `app/(app)/(resident)/home.tsx`  
**Roles:** `RESIDENT`

### UI Layout
```
┌─────────────────────────────────┐
│  Hello, Rahul Kumar     🔔      │
│  A-101, Green Valley            │
├─────────────────────────────────┤
│         Quick Actions           │
│  [📋 Raise Complaint]           │
│  [👥 Pre-register Visitor]      │
│  [🏸 Book Amenity]              │
│  [📄 Documents]                 │
├─────────────────────────────────┤
│  📢 Announcements               │
│  ┌─────────────────────────┐   │
│  │ 🔴 EMERGENCY            │   │  ← Priority badge
│  │ Water supply disruption │   │
│  │ 2 hours ago             │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ 📌 IMPORTANT            │   │
│  │ Society AGM on June 15  │   │
│  │ 1 day ago          [ACK]│   │  ← Acknowledge button
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ ℹ️ NORMAL               │   │
│  │ Pool cleaning: Saturday │   │
│  │ 3 days ago              │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Announcement Card Component
```typescript
interface AnnouncementCardProps {
  announcement: Announcement;
  onPress: () => void;
  onAcknowledge?: () => void;
}

// Priority badges:
// EMERGENCY → red background, "EMERGENCY" text
// IMPORTANT → amber background, "IMPORTANT" text
// NORMAL    → blue background (no badge text)

// Shows ACK button if:
// - announcement.required_ack === true
// - AND current user hasn't acknowledged yet
```

### Quick Action Cards
```typescript
// 4 quick action cards in 2x2 grid
// Each navigates to the relevant create/list screen
const RESIDENT_QUICK_ACTIONS = [
  { icon: "report-problem", label: "Raise Complaint", route: "/(app)/(resident)/complaints/new" },
  { icon: "people",         label: "Pre-register Visitor", route: "/(app)/(resident)/visitors/new" },
  { icon: "event",          label: "Book Amenity", route: "/(app)/(resident)/bookings/new" },
  { icon: "folder",         label: "Documents", route: "/(app)/(resident)/documents" },
];
```

---

## 4. Announcement Detail Screen

**File:** `app/(app)/announcements/[id].tsx`  
**Shared between all roles**

```
┌─────────────────────────────────┐
│  ←  Announcement                │
├─────────────────────────────────┤
│  🔴 IMPORTANT                   │
│  Society AGM — June 15, 2024    │
│  Posted by: Admin • 1 day ago   │
├─────────────────────────────────┤
│  The Annual General Meeting of  │
│  Green Valley Society will be   │
│  held on June 15, 2024...       │
├─────────────────────────────────┤
│  📊 POLL: Choose AGM Time       │  ← If type = POLL
│  ○ 10:00 AM (45%)               │
│  ● 6:00 PM (55%)                │  ← Selected by user
│  Voting closes: June 14         │
│  [Vote]                         │  ← Disabled after voting
├─────────────────────────────────┤
│  [✓ Acknowledge]                │  ← If required_ack=true
└─────────────────────────────────┘
```

### API Calls in this Screen

```typescript
// 1. Fetch announcement detail
const { data: announcement } = useQuery({
  queryKey: ["announcement", id],
  queryFn: () => getAnnouncement(id),
});

// 2. Acknowledge
const { mutate: acknowledge } = useMutation({
  mutationFn: () => acknowledgeAnnouncement(id, userId),
  onSuccess: () => {
    queryClient.invalidateQueries(["announcements"]);
    showToast({ type: "success", message: "Acknowledged ✓" });
  },
});

// 3. Vote on poll
const { mutate: vote } = useMutation({
  mutationFn: (option: string) => votePoll(pollId, userId, option),
  onSuccess: () => {
    queryClient.invalidateQueries(["announcement", id]);
    showToast({ type: "success", message: "Vote recorded" });
  },
});
```

---

## 5. API Service (`src/api/announcements.ts`)

```typescript
import { apiClient } from "./client";

export async function getAnnouncements(params?: {
  communityId?: string;
}): Promise<{ announcements: Announcement[] }> {
  const { data } = await apiClient.get("/v1/announcements", { params });
  return data;
}

export async function getAnnouncement(id: string): Promise<Announcement> {
  const { data } = await apiClient.get(`/v1/announcements/${id}`);
  return data;
}

export async function acknowledgeAnnouncement(
  id: string, userId: string
): Promise<void> {
  await apiClient.post(`/v1/announcements/${id}/ack`, { userId });
}

export async function votePoll(
  pollId: string, userId: string, selectedOption: string
): Promise<void> {
  await apiClient.post(`/v1/announcements/polls/${pollId}/votes`, {
    userId, selectedOption,
  });
}

export async function getDashboard(communityId: string) {
  const { data } = await apiClient.get("/v1/reports/dashboard", {
    params: { community_id: communityId },
  });
  return data;
}
```

---

## 6. Acceptance Criteria

| Check | Expected |
|---|---|
| FM opens Dashboard | 8 KPI cards with real backend data |
| KPI value ≥ threshold | Card has red border + pulse |
| Tap any KPI card | Navigate to relevant list |
| Dashboard auto-refreshes | Data updates every 60 seconds |
| Resident opens Home | Announcement feed with priority badges |
| EMERGENCY announcement | Pinned at top with red badge |
| Tap ACK on announcement | Status changes, button disappears |
| Vote on poll | Option selected, percentages update |
| Skeleton loading | Shown while data loads, not empty screen |

---

## 7. Next Phase Prerequisites

- [ ] FM Dashboard with 8 KPI cards complete + polling
- [ ] Resident Home with announcement feed
- [ ] Announcement Detail with poll voting + acknowledge
- [ ] KPI card tap navigation to correct screens
- [ ] Loading skeletons on all screens
