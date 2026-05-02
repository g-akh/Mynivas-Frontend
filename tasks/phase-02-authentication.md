# Phase 02 — Authentication & Session Management

**Status:** TODO  
**Estimated Time:** 3–4 days  
**Depends on:** Phase 01 complete  
**Blocks:** Phase 03 (navigation needs auth state)

---

## 1. Phase Overview

### Objectives
- OTP-based phone login (no passwords)
- Secure token storage with auto-refresh
- Role-based post-login routing
- Biometric re-auth (optional, Phase 16)

### Screens in this Phase
1. `SplashScreen` — app boot, session check
2. `LoginScreen` — phone number entry
3. `OTPScreen` — 6-digit OTP verification
4. `WelcomeScreen` — first-time user name entry (if `user.name` is empty)

### Backend Endpoints Used

| Action | Method | Endpoint | Auth |
|---|---|---|---|
| Request OTP | POST | `/v1/auth/request-otp` | None |
| Verify OTP | POST | `/v1/auth/verify-otp` | None |
| Refresh token | POST | `/v1/auth/refresh` | None |
| Logout | POST | `/v1/auth/logout` | JWT |
| Get current user | GET | `/v1/auth/me` | JWT |
| Register device (push) | POST | `/v1/users/:userId/devices` | JWT |

---

## 2. API Service Layer

### `src/api/auth.ts`

```typescript
import { apiClient } from "./client";

export interface RequestOtpResponse {
  sessionId: string;
  expiresAt: string;
  otp?: string;             // only in dev when DEV_OTP_ECHO=1
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;        // 900 seconds
  user: {
    id: string;
    tenantId: string;
    communityId: string;
    roles: string[];
    phone: string;
    name: string;
  };
}

// POST /v1/auth/request-otp
export async function requestOtp(phone: string): Promise<RequestOtpResponse> {
  const { data } = await apiClient.post("/v1/auth/request-otp", { phone });
  return data;
}

// POST /v1/auth/verify-otp
export async function verifyOtp(sessionId: string, otp: string): Promise<VerifyOtpResponse> {
  const { data } = await apiClient.post("/v1/auth/verify-otp", { sessionId, otp });
  return data;
}

// POST /v1/auth/logout
export async function logout(): Promise<void> {
  await apiClient.post("/v1/auth/logout");
}

// GET /v1/auth/me
export async function getMe(): Promise<VerifyOtpResponse["user"]> {
  const { data } = await apiClient.get("/v1/auth/me");
  return data;
}

// POST /v1/users/:userId/devices
export async function registerDevice(userId: string, params: {
  deviceId: string;
  platform: "ANDROID" | "IOS";
  pushToken: string;
}): Promise<void> {
  await apiClient.post(`/v1/users/${userId}/devices`, params);
}
```

---

## 3. Screen Specifications

### 3.1 SplashScreen

**File:** `app/index.tsx`  
**Purpose:** Boot → check stored session → redirect

```tsx
// Pseudocode flow:
// 1. Show MyNivas logo + loading spinner
// 2. Call loadSession() from auth store
// 3. If isAuthenticated → route to (app) based on role
// 4. If not → route to (auth)/login
```

**UI:**
- Full-screen navy background (`#1B4F72`)
- MyNivas logo (centered)
- Activity indicator (white)
- No buttons — auto-navigates

**States:**
- Loading: logo + spinner
- Session found: → navigate to home (100ms delay for smooth transition)
- No session: → navigate to login

---

### 3.2 LoginScreen

**File:** `app/(auth)/login.tsx`  
**Route:** `/login`

**UI Components:**
```
┌─────────────────────────────────┐
│        MyNivas Logo             │
│   "Welcome to MyNivas"          │
│   "Enter your mobile number"    │
│                                 │
│  ┌──────────────────────────┐   │
│  │ +91 │ 9876543210         │   │  ← PhoneInput
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │    Send OTP              │   │  ← Primary Button
│  └──────────────────────────┘   │
│                                 │
│  By continuing you agree to     │
│  Terms of Service               │
└─────────────────────────────────┘
```

**Form Fields:**
| Field | Component | Validation | Backend rule |
|---|---|---|---|
| phone | PhoneInput | Required, E.164 format | `^\+[1-9]\d{9,14}$` |

**Phone Input Component (`src/components/forms/PhoneInput.tsx`):**
- Country code selector (default: +91 India)
- 10-digit number input
- Auto-format: removes non-digits
- Shows flag emoji for country

**Button States:**
- Default: "Send OTP" (enabled when phone valid)
- Loading: "Sending…" + spinner (disabled)
- Success: → navigate to OTPScreen with `{ sessionId, phone, expiresAt }`

**Error Handling:**
| HTTP Status | Display |
|---|---|
| 400 | Inline: "Invalid phone number format" |
| 429 | Toast: "Too many attempts. Try again in 60 seconds." |
| 500 | Toast: "Something went wrong. Please try again." |

**API Call:**
```typescript
const { mutate, isPending } = useMutation({
  mutationFn: () => requestOtp(phone),
  onSuccess: (data) => {
    router.push({ pathname: "/verify-otp", params: { sessionId: data.sessionId, phone } });
    // In dev: if (data.otp) setClipboard(data.otp) // auto-fill hint
  },
  onError: (error) => showToast(getErrorMessage(error)),
});
```

---

### 3.3 OTPScreen

**File:** `app/(auth)/verify-otp.tsx`  
**Route:** `/verify-otp`  
**Params:** `{ sessionId: string, phone: string }`

**UI Components:**
```
┌─────────────────────────────────┐
│  ←  Verify OTP                  │
│                                 │
│  "Enter the 6-digit code sent"  │
│  "to +91 9876543210"            │
│                                 │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │  ← OTP boxes
│  │  │ │  │ │  │ │  │ │  │ │  │ │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ │
│                                 │
│  ┌──────────────────────────┐   │
│  │    Verify                │   │  ← Auto-submits at 6 digits
│  └──────────────────────────┘   │
│                                 │
│  Resend OTP (in 28s)            │  ← Countdown timer
└─────────────────────────────────┘
```

**OTP Input Behavior:**
- 6 individual text boxes
- Auto-focus next box on digit entry
- Auto-focus previous box on backspace
- Auto-submit when all 6 filled (no button press needed)
- Paste support: paste "123456" → fills all 6

**Resend Timer:**
- Starts at 30 seconds
- Shows "Resend OTP (in Xs)" — disabled
- At 0: shows "Resend OTP" link — enabled
- On resend: calls `requestOtp` again with same phone, resets timer

**API Call:**
```typescript
const { mutate, isPending } = useMutation({
  mutationFn: () => verifyOtp(sessionId, otp),
  onSuccess: async (data) => {
    await authStore.setSession(data.user, data.accessToken, data.refreshToken);
    await registerPushNotifications(data.user.id); // register FCM/APNS token
    routeByRole(data.user.roles);
  },
  onError: (error) => {
    clearOTP();
    showToast(getErrorMessage(error));
  },
});
```

**Post-Login Routing (`src/utils/routing.ts`):**
```typescript
export function routeByRole(roles: string[]): void {
  if (roles.includes("SUPER_ADMIN") || roles.includes("TENANT_ADMIN")) {
    router.replace("/(app)/(admin)/tenants");
  } else if (roles.includes("COMMUNITY_ADMIN") || roles.includes("FM")) {
    router.replace("/(app)/(fm)/dashboard");
  } else if (roles.includes("TECHNICIAN")) {
    router.replace("/(app)/(fm)/work-orders");
  } else if (roles.includes("GUARD")) {
    router.replace("/(app)/(guard)/gate");
  } else {
    router.replace("/(app)/(resident)/home");
  }
}
```

**Error Handling:**
| HTTP Status | Display |
|---|---|
| 400 | Clear OTP boxes, toast: "Incorrect OTP. Please try again." |
| 401 | Clear OTP boxes, toast: "OTP expired. Request a new one." |
| 429 | Toast: "Too many attempts. Request a new OTP." |

---

### 3.4 Push Notification Registration

Called immediately after successful login:

```typescript
// src/utils/push.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { registerDevice } from "../api/auth";

export async function registerPushNotifications(userId: string): Promise<void> {
  if (!Device.isDevice) return; // Skip in simulator

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return; // User denied

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  const platform = Platform.OS === "ios" ? "IOS" : "ANDROID";

  await registerDevice(userId, {
    deviceId: token,
    platform,
    pushToken: token,
  }).catch(() => {}); // Best-effort
}
```

---

## 4. Auth Layout (`app/(auth)/_layout.tsx`)

```tsx
import { Stack } from "expo-router";
import { useAuthStore } from "../../src/store/auth.store";
import { Redirect } from "expo-router";

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  // If already logged in, redirect to app
  if (isAuthenticated) return <Redirect href="/(app)" />;

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="verify-otp"
        options={{
          headerTitle: "Verify OTP",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: "#1B4F72" },
          headerTintColor: "#FFFFFF",
        }}
      />
    </Stack>
  );
}
```

---

## 5. Reusable Components

### `src/components/forms/OTPInput.tsx`
```typescript
// Props:
interface OTPInputProps {
  length: number;          // 6
  onComplete: (otp: string) => void;
  error?: string;
  disabled?: boolean;
}
// Renders 6 text inputs with auto-focus navigation
// Exposes clear() via ref
```

### `src/components/common/LoadingButton.tsx`
```typescript
interface LoadingButtonProps {
  title: string;
  loadingTitle?: string;
  onPress: () => void;
  isLoading: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}
```

### `src/components/common/Toast.tsx`
```typescript
// Global toast via zustand ui store
// Usage: showToast({ type: "error", message: "Something went wrong" })
// Auto-dismisses after 4000ms
```

---

## 6. Testing Requirements

```typescript
// __tests__/screens/LoginScreen.test.tsx
describe("LoginScreen", () => {
  it("Submit button disabled when phone empty", () => { ... });
  it("Submit button disabled when phone < 10 digits", () => { ... });
  it("Calls requestOtp with correct E.164 phone", () => { ... });
  it("Shows error toast on 429 response", () => { ... });
  it("Navigates to verify-otp with sessionId on success", () => { ... });
});

// __tests__/screens/OTPScreen.test.tsx
describe("OTPScreen", () => {
  it("Auto-submits when 6 digits entered", () => { ... });
  it("Clears OTP on error response", () => { ... });
  it("Resend button disabled during 30s countdown", () => { ... });
  it("Routes to FM dashboard for FM role", () => { ... });
  it("Routes to home for RESIDENT role", () => { ... });
});
```

---

## 7. Acceptance Criteria

| Check | Expected |
|---|---|
| Enter valid phone → tap Send OTP | OTP request sent, navigate to OTP screen |
| Enter wrong OTP | Boxes cleared, error toast shown |
| Enter correct OTP | Session stored, navigate to role-appropriate home |
| Kill app and reopen | Auto-login if token valid (< 15 min) |
| Token expired on reopen | Refresh attempted, success → home, fail → login |
| Logout | Tokens cleared, navigate to login |
| Push permission | Asked on first login, token sent to backend |

---

## 8. Next Phase Prerequisites

- [ ] Login + OTP screens complete and tested on Android + iOS
- [ ] `useAuthStore` persists session correctly
- [ ] Token refresh interceptor working (test: wait 15 min, make a request)
- [ ] Push notification token registered
- [ ] Post-login routing by role working for all 7 roles
