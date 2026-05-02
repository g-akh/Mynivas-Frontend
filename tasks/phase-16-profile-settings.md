# Phase 16 — Profile & Settings

**Status:** TODO  
**Estimated Time:** 2–3 days  
**Depends on:** Phase 02  

---

## 1. Screens
1. **Profile Screen** — view/edit user info
2. **Settings Screen** — app preferences
3. **Change Community** — multi-community users
4. **About / Legal** — app version, T&C, privacy policy

---

## 2. Profile Screen

**File:** `app/(app)/profile/index.tsx`

```
┌─────────────────────────────────┐
│  👤 Rahul Kumar                 │
│  +91 9876543210                 │
│  Roles: RESIDENT                │
│  Unit: A-101, Building A        │
│  Green Valley Society           │
│                                 │
│  [Edit Name]                    │
│                                 │
│  ─── Account ───                │
│  Notification Preferences  [→]  │
│  Language                  [→]  │
│                                 │
│  ─── App ───                    │
│  App Version: 1.0.0             │
│  Terms of Service          [→]  │
│  Privacy Policy            [→]  │
│                                 │
│  [🚪 Sign Out]                  │
└─────────────────────────────────┘
```

**Edit Name:** `PATCH /v1/users/:userId` with `{ name: newName }`

---

## 3. Settings Screen

**File:** `app/(app)/settings/index.tsx`

Settings stored in MMKV (local device, not synced):
```typescript
const settings = {
  biometricLogin: boolean,     // Phase 17+ feature
  language: "en" | "hi",      // i18n (future)
  dateFormat: "DD/MM/YYYY",
  currency: "INR",
  theme: "light",              // dark mode future
};
```

---

## 4. Logout Flow

```typescript
const handleLogout = async () => {
  // Show confirm dialog
  Alert.alert(
    "Sign Out",
    "Are you sure you want to sign out?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();          // POST /v1/auth/logout (best-effort)
          await authStore.logout(); // Clear stored tokens
          queryClient.clear();      // Clear all cached data
          router.replace("/(auth)/login");
        },
      },
    ]
  );
};
```

---

## 5. Acceptance Criteria

| Check | Expected |
|---|---|
| Edit name | PATCH called, profile updated |
| Sign out | Tokens cleared, redirected to login |
| Sign out clears all cached data | React Query cache cleared |
| App version shown | From `expo-constants` |
