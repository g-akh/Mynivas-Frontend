# Phase 17 — Testing

**Status:** DONE  
**Estimated Time:** 5–7 days  
**Depends on:** Phases 01–16 complete  

---

## 1. Testing Stack

| Layer | Tool | Purpose |
|---|---|---|
| Unit tests | Jest + React Native Testing Library | Component logic, hooks, utils |
| Integration tests | Jest + MSW (Mock Service Worker) | API call flows |
| E2E tests | Maestro | Full screen-to-screen flows on device |

---

## 2. Unit Test Coverage Requirements

**Minimum 80% coverage on:**
- `src/api/*.ts` — all API functions
- `src/store/*.ts` — all Zustand stores
- `src/utils/*.ts` — formatters, validators
- `src/components/forms/*.tsx` — form components

```bash
npm test -- --coverage
```

---

## 3. Key E2E Test Scenarios (Maestro)

### Scenario 1: Resident Full Flow
```yaml
# maestro/resident-flow.yaml
appId: com.mynivas.app
---
- launchApp
- tapOn: "Enter mobile number"
- inputText: "+919876543210"
- tapOn: "Send OTP"
- inputText:
    id: "otp-input"
    text: "123456"
- assertVisible: "Hello"          # Home screen
- tapOn: "Raise Complaint"
- selectListItem: "Plumbing"
- tapOn: "HIGH"
- inputText:
    id: "description"
    text: "Water leak in bathroom wall"
- tapOn: "Submit Complaint"
- assertVisible: "Complaint raised successfully"
```

### Scenario 2: Guard Visitor Flow
```yaml
# maestro/guard-flow.yaml
---
- launchApp
- # Login as guard
- tapOn: "Scan QR"
- # Simulate QR scan
- assertVisible: "Approve"
- tapOn: "APPROVE"
- assertVisible: "Visitor approved"
```

### Scenario 3: FM Dashboard
```yaml
# maestro/fm-dashboard.yaml
---
- launchApp
- # Login as FM
- assertVisible: "Open Complaints"
- tapOn: "Open Complaints"
- assertVisible: "Complaints"      # Navigated to complaints list
```

---

## 4. API Mock Setup (MSW)

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("/v1/auth/request-otp", () =>
    HttpResponse.json({ sessionId: "sess-123", expiresAt: "2024-06-15T10:30:00Z" })
  ),

  http.post("/v1/auth/verify-otp", () =>
    HttpResponse.json({
      accessToken: "token-abc",
      refreshToken: "refresh-xyz",
      expiresIn: 900,
      user: {
        id: "user-1",
        tenantId: "tenant-1",
        communityId: "comm-1",
        roles: ["RESIDENT"],
        phone: "+919876543210",
        name: "Rahul Kumar",
      },
    })
  ),

  http.get("/v1/reports/dashboard", () =>
    HttpResponse.json({
      complaints: { open_count: 5, breaching_sla_count: 1 },
      visitors: { pending_approval_count: 2, currently_checked_in_count: 3 },
      work_orders: { unassigned_count: 4, blocked_count: 0 },
      ppm: { overdue_count: 1 },
      announcements: { pending_ack_count: 8 },
    })
  ),

  // ... handlers for all 50+ endpoints
];
```

---

## 5. Device Testing Matrix

Test on ALL of these before production build:

**Android:**
| Device | OS | Priority |
|---|---|---|
| Samsung Galaxy S23 | Android 13 | P0 |
| Pixel 7 | Android 14 | P0 |
| Redmi Note 12 | Android 12 | P1 |
| Samsung Galaxy A54 | Android 13 | P1 |
| Old device (2019) | Android 10 | P2 |

**iOS:**
| Device | OS | Priority |
|---|---|---|
| iPhone 15 Pro | iOS 17 | P0 |
| iPhone 13 | iOS 16 | P0 |
| iPhone SE (3rd gen) | iOS 16 | P1 |
| iPad (optional) | iPadOS 17 | P2 |

---

## 6. Acceptance Criteria (Launch Gates)

| Check | Required |
|---|---|
| Zero crash on Android P0 devices | ✅ Required |
| Zero crash on iOS P0 devices | ✅ Required |
| All auth flows working | ✅ Required |
| All role navigation correct | ✅ Required |
| Push notifications delivered | ✅ Required |
| File upload/download working | ✅ Required |
| Offline state handled gracefully | ✅ Required |
| Unit test coverage ≥ 80% | ✅ Required |
| E2E resident + FM flows passing | ✅ Required |
| No console.error in production build | ✅ Required |
