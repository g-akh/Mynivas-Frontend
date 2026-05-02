# Phase 03 — Navigation & Role-Based Routing

**Status:** TODO  
**Estimated Time:** 2–3 days  
**Depends on:** Phase 02  
**Blocks:** Phases 04–16

---

## 1. Phase Overview

### Objectives
- Build the complete navigation shell for all 7 roles
- Each role sees a tailored tab bar with only relevant tabs
- Shared header with notification bell + profile avatar
- Deep linking support for push notification taps

### Navigation Structure

```
app/
├── index.tsx                  ← Splash/redirect
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── verify-otp.tsx
└── (app)/
    ├── _layout.tsx            ← Auth guard → redirect to login if not authenticated
    ├── (resident)/
    │   ├── _layout.tsx        ← Bottom tab: Home | Complaints | Visitors | Bookings | More
    │   ├── home.tsx
    │   ├── complaints/
    │   ├── visitors/
    │   ├── bookings/
    │   └── more/
    ├── (fm)/
    │   ├── _layout.tsx        ← Bottom tab: Dashboard | Complaints | Visitors | Work Orders | More
    │   ├── dashboard.tsx
    │   ├── complaints/
    │   ├── visitors/
    │   ├── work-orders/
    │   └── more/              ← Amenities, Reports, Documents, Settings
    ├── (guard)/
    │   ├── _layout.tsx        ← Bottom tab: Gate | History | Profile
    │   ├── gate.tsx
    │   ├── history.tsx
    │   └── profile.tsx
    ├── (technician)/
    │   ├── _layout.tsx        ← Bottom tab: My Tasks | Profile
    │   ├── tasks.tsx
    │   └── profile.tsx
    └── (admin)/
        ├── _layout.tsx        ← Bottom tab: Overview | Tenants | Communities | Users | Settings
        ├── overview.tsx
        ├── tenants/
        ├── communities/
        ├── users/
        └── settings/
```

---

## 2. App Layout — Auth Guard

**File:** `app/(app)/_layout.tsx`

```tsx
import { Redirect } from "expo-router";
import { useAuthStore } from "../../src/store/auth.store";

export default function AppLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  // Route to role-specific navigator
  const role = user?.roles[0];
  if (role === "SUPER_ADMIN" || role === "TENANT_ADMIN") {
    return <Redirect href="/(app)/(admin)/overview" />;
  }
  if (role === "COMMUNITY_ADMIN" || role === "FM") {
    return <Redirect href="/(app)/(fm)/dashboard" />;
  }
  if (role === "TECHNICIAN") {
    return <Redirect href="/(app)/(technician)/tasks" />;
  }
  if (role === "GUARD") {
    return <Redirect href="/(app)/(guard)/gate" />;
  }
  return <Redirect href="/(app)/(resident)/home" />;
}
```

---

## 3. Tab Navigators Per Role

### 3.1 Resident Tab Navigator

**File:** `app/(app)/(resident)/_layout.tsx`

```tsx
// Tabs: Home | Complaints | Visitors | Bookings | More
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function ResidentLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1B4F72",
        tabBarInactiveTintColor: "#95A5A6",
        tabBarStyle: { height: 60, paddingBottom: 8 },
        headerStyle: { backgroundColor: "#1B4F72" },
        headerTintColor: "#FFFFFF",
        headerRight: () => <HeaderActions />,
      }}
    >
      <Tabs.Screen name="home"
        options={{ title: "Home", tabBarIcon: ({ color }) => <MaterialIcons name="home" color={color} size={24} /> }} />
      <Tabs.Screen name="complaints"
        options={{ title: "Complaints", tabBarIcon: ({ color }) => <MaterialIcons name="report-problem" color={color} size={24} /> }} />
      <Tabs.Screen name="visitors"
        options={{ title: "Visitors", tabBarIcon: ({ color }) => <MaterialIcons name="people" color={color} size={24} /> }} />
      <Tabs.Screen name="bookings"
        options={{ title: "Bookings", tabBarIcon: ({ color }) => <MaterialIcons name="event" color={color} size={24} /> }} />
      <Tabs.Screen name="more"
        options={{ title: "More", tabBarIcon: ({ color }) => <MaterialIcons name="more-horiz" color={color} size={24} /> }} />
    </Tabs>
  );
}
```

### 3.2 FM Tab Navigator

**File:** `app/(app)/(fm)/_layout.tsx`

```
Tabs: Dashboard | Complaints | Visitors | Work Orders | More
```
| Tab | Icon | Screen |
|---|---|---|
| Dashboard | `dashboard` | FM KPI cards + quick actions |
| Complaints | `support-agent` | All complaints list + kanban |
| Visitors | `door-front` | Visitor log + approvals |
| Work Orders | `build` | Work orders list |
| More | `more-horiz` | Amenities, Reports, Documents, PPM, Users, Settings |

### 3.3 Guard Tab Navigator

**File:** `app/(app)/(guard)/_layout.tsx`

```
Tabs: Gate | History | Profile
```
| Tab | Screen |
|---|---|
| Gate | Active visitor check-in/out |
| History | Today's visitor log |
| Profile | Guard profile + logout |

### 3.4 Technician Tab Navigator

**File:** `app/(app)/(technician)/_layout.tsx`

```
Tabs: My Tasks | Profile
```

### 3.5 Admin Tab Navigator

**File:** `app/(app)/(admin)/_layout.tsx`

```
Tabs: Overview | Tenants/Communities | Users | Onboarding | Settings
```
| Role | Tabs |
|---|---|
| SUPER_ADMIN | Overview | Tenants | Communities | Onboarding | Settings |
| TENANT_ADMIN | Overview | Communities | Users | Settings |
| COMMUNITY_ADMIN | Overview (FM Dashboard) | Users | Amenities | Documents | Settings |

---

## 4. Shared Header Component

**File:** `src/components/common/AppHeader.tsx`

```tsx
// Appears on every authenticated screen
// Left: Screen title or back button
// Right: Notification bell (badge count) + Avatar

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  showNotificationBell?: boolean;
}

// Notification badge: count from useNotificationStore
// Avatar: user initials with navy background
// Bell tap: navigate to /(app)/notifications
```

---

## 5. Deep Linking Configuration

**`app.config.ts` addition:**
```typescript
scheme: "mynivas",
// Deep link examples:
// mynivas://complaints/abc-123          → open complaint detail
// mynivas://visitors/approve/abc-123   → visitor approval screen
// mynivas://bookings/abc-123           → booking detail
```

**Push notification tap routing (`src/utils/notifications.ts`):**
```typescript
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

export function setupNotificationTapHandler() {
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;

    switch (data.type) {
      case "VISITOR_APPROVAL":
        router.push(`/(app)/(resident)/visitors/approve/${data.visitorId}`);
        break;
      case "COMPLAINT_UPDATE":
        router.push(`/(app)/(resident)/complaints/${data.complaintId}`);
        break;
      case "BOOKING_STATUS":
        router.push(`/(app)/(resident)/bookings/${data.bookingId}`);
        break;
      case "AMENITY_SLOT_AVAILABLE":
        router.push(`/(app)/(resident)/bookings/new`);
        break;
    }
  });
}
```

---

## 6. "More" Screen (Resident)

**File:** `app/(app)/(resident)/more/index.tsx`

Menu items (icon + title + route):
```
Documents         → /documents
Profile           → /profile
Settings          → /settings
Help & Support    → /support
About MyNivas     → /about
Logout            → (action)
```

---

## 7. "More" Screen (FM)

**File:** `app/(app)/(fm)/more/index.tsx`

```
Amenities         → /amenities
Reports           → /reports
Documents         → /documents
PPM Schedules     → /ppm
Announcements     → /announcements
Notification Config → /settings/notifications
Community Settings → /settings/community
Users             → /settings/users
Audit Logs        → /settings/audit
Profile           → /profile
Logout            → (action)
```

---

## 8. Reusable Navigation Components

### `src/components/common/MenuList.tsx`
```typescript
// Renders a list of menu items with icon, title, chevron, optional badge
interface MenuItem {
  icon: string;        // MaterialIcons name
  title: string;
  subtitle?: string;
  badge?: number;
  onPress: () => void;
  destructive?: boolean;
}
```

### `src/components/common/BackButton.tsx`
```typescript
// Platform-aware back button
// iOS: < Back (chevron)
// Android: ← (hardware back handled automatically by Expo Router)
```

---

## 9. Acceptance Criteria

| Check | Expected |
|---|---|
| Login as RESIDENT | See tabs: Home, Complaints, Visitors, Bookings, More |
| Login as FM | See tabs: Dashboard, Complaints, Visitors, Work Orders, More |
| Login as GUARD | See tabs: Gate, History, Profile |
| Login as TECHNICIAN | See tabs: My Tasks, Profile |
| Login as COMMUNITY_ADMIN | See FM tabs |
| Login as SUPER_ADMIN | See Admin tabs |
| Tap notification | Deep link navigates to correct screen |
| Hardware back (Android) | Returns to previous screen correctly |
| Tab bar visible | On all main screens, hidden on detail screens |

---

## 10. Next Phase Prerequisites

- [ ] All role navigators built and routing correctly
- [ ] Deep linking configured in `app.config.ts`
- [ ] Push notification tap handler installed
- [ ] Shared header component working with notification bell
- [ ] "More" screen lists built for RESIDENT and FM
- [ ] No TypeScript errors in navigation files
