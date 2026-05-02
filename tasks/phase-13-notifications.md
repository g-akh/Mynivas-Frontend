# Phase 13 — Push Notifications & In-App Notification Center

**Status:** DONE  
**Estimated Time:** 2–3 days  
**Depends on:** Phase 02 (push token registration)  

---

## 1. Screens
1. **Notification Center** — in-app notification list
2. **Notification Settings** — per-channel preferences (future scope)

---

## 2. Push Notification Types & Deep Links

| Template Key | Channel | Deep Link on Tap |
|---|---|---|
| `AMENITY_BOOKING_CONFIRMED` | PUSH | `/bookings/:id` |
| `AMENITY_BOOKING_REJECTED` | PUSH | `/bookings/:id` |
| `AMENITY_BOOKING_CANCELLED` | PUSH | `/bookings/:id` |
| `COMPLAINT_CREATED` | PUSH | `/complaints/:id` |
| `COMPLAINT_ASSIGNED` | PUSH | `/complaints/:id` |
| `COMPLAINT_RESOLVED` | PUSH | `/complaints/:id` |
| `VISITOR_APPROVAL_REQUEST` | PUSH | `/visitors/approve/:id` |
| `VISITOR_APPROVED` | PUSH | `/visitors/:id` |
| `VISITOR_CHECKED_IN` | PUSH | `/visitors/:id` |
| `AMENITY_SLOT_AVAILABLE` | PUSH | `/bookings/new` |
| `BILLING_OVERDUE` | PUSH | `/billing` |
| `PPM_SCHEDULE_DUE` | PUSH | `/ppm` |

---

## 3. Expo Notifications Setup

**`src/utils/notifications.ts`:**
```typescript
import * as Notifications from "expo-notifications";

// Configure foreground behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Handle background notification tap
export function setupNotificationHandlers() {
  // Foreground: show in-app banner
  Notifications.addNotificationReceivedListener((notification) => {
    addToNotificationStore(notification);
  });

  // Background tap: deep link
  Notifications.addNotificationResponseReceivedListener((response) => {
    const { type, id } = response.notification.request.content.data;
    handleDeepLink(type, id);
  });
}

function handleDeepLink(type: string, id?: string) {
  const routes: Record<string, string> = {
    BOOKING:          `/(app)/(resident)/bookings/${id}`,
    COMPLAINT:        `/(app)/(resident)/complaints/${id}`,
    VISITOR_APPROVAL: `/(app)/(resident)/visitors/approve/${id}`,
    VISITOR:          `/(app)/(resident)/visitors/${id}`,
    BILLING:          `/(app)/(resident)/billing`,
  };
  if (routes[type]) router.push(routes[type]);
}
```

---

## 4. Notification Center Screen

**File:** `app/(app)/notifications/index.tsx`

```
┌─────────────────────────────────┐
│  ←  Notifications      [Mark All]│
├─────────────────────────────────┤
│  ● Booking Confirmed         2m │  ● = unread
│    Gym slot Jun 8, 08:00        │
│  ─────────────────────────────  │
│  ● Complaint Assigned       15m │
│    #COMP-042 assigned to John   │
│  ─────────────────────────────  │
│  ○ Visitor Approved          1h │  ○ = read
│    John Smith approved at gate  │
└─────────────────────────────────┘
```

**In-app notification store (Zustand):**
```typescript
// Notifications stored locally (not fetched from backend)
// Populated when push notification received in foreground
// Cleared on app restart (or persist with MMKV)
interface NotificationStore {
  notifications: LocalNotification[];
  unreadCount: number;
  addNotification: (n: LocalNotification) => void;
  markAllRead: () => void;
  clear: () => void;
}
```

**Bell badge:**
- Shows red badge on notification bell in header
- Count = `unreadCount` from store
- Tap bell → `/notifications`

---

## 5. Visitor Approval Deep Link Screen

**File:** `app/(app)/(resident)/visitors/approve/[visitorId].tsx`

Opened when resident taps "Visitor waiting for approval" push notification:

```
┌─────────────────────────────────┐
│  Visitor at Gate                │
├─────────────────────────────────┤
│  👤 John Smith                  │
│  Type: GUEST                    │
│  Unit: A-101 (your unit)        │
│  Arrived: Just now              │
├─────────────────────────────────┤
│  [✓ Approve Entry]              │
│  [✕ Deny Entry]                 │
└─────────────────────────────────┘
```

---

## 6. Acceptance Criteria

| Check | Expected |
|---|---|
| App in foreground, push received | In-app banner shown |
| App in background, push received | System notification shown |
| Tap booking notification | Opens booking detail screen |
| Tap visitor approval notification | Opens approve/deny screen |
| Unread badge on bell | Shows count of unread notifications |
| Mark all read | Badge clears |
| Android notification permissions | Requested on first launch |
| iOS notification permissions | Requested on first launch |
