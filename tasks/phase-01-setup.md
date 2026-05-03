# Phase 01 — Project Setup & Architecture

**Status:** DONE  
**Estimated Time:** 2–3 days  
**Blocks:** All subsequent phases  
**No backend dependency** — this is pure project scaffolding.

---

## 1. Phase Overview

### Objectives
- Initialize the Expo + React Native project with TypeScript
- Configure folder structure, navigation shell, theme, and API client
- Set up EAS Build for Android + iOS production builds
- Establish code quality tools (ESLint, Prettier, Husky)
- Connect to backend API gateway with a working health check

### Success Criteria
- [x] `npx expo start` runs without errors
- [x] App opens on Android emulator AND iOS simulator
- [x] `GET /health` from backend returns `{ status: "ok" }` in the app (login.tsx health check)
- [x] Folder structure matches `phases-index.md` target
- [x] EAS build profile configured for `development`, `preview`, `production`
- [x] TypeScript strict mode with zero type errors

---

## 2. Step-by-Step Setup

### 2.1 Initialize Project

```bash
# In E:\projects\Mynivas-Frontend (already cloned)
npx create-expo-app@latest . --template tabs
# Choose TypeScript when prompted

# Verify
npx expo start
```

### 2.2 Install All Dependencies

```bash
# Navigation (Expo Router is default in Expo SDK 51)
npx expo install expo-router

# State Management
npm install zustand @tanstack/react-query@5

# HTTP Client
npm install axios

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# UI Components
npm install react-native-paper react-native-safe-area-context
npm install react-native-vector-icons

# Storage (secure token store)
npx expo install expo-secure-store
npm install react-native-mmkv

# Push Notifications
npx expo install expo-notifications expo-device

# File handling
npx expo install expo-document-picker expo-image-picker
npx expo install expo-file-system

# Utilities
npm install dayjs uuid
npm install @types/uuid --save-dev

# Charts
npm install victory-native react-native-reanimated react-native-svg

# Dev tools
npm install --save-dev eslint prettier eslint-plugin-react-hooks
npm install --save-dev @typescript-eslint/eslint-plugin
npm install --save-dev husky lint-staged
```

### 2.3 Configure `app.config.ts`

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MyNivas",
  slug: "mynivas",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#1B4F72",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.mynivas.app",
    infoPlist: {
      NSCameraUsageDescription: "Used to scan QR codes for visitor passes",
      NSPhotoLibraryUsageDescription: "Used to upload documents",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#1B4F72",
    },
    package: "com.mynivas.app",
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
    ],
  },
  plugins: [
    "expo-router",
    "expo-notifications",
    "expo-secure-store",
    [
      "expo-document-picker",
      { iCloudContainerEnvironment: "Production" },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001",
    eas: { projectId: "YOUR_EAS_PROJECT_ID" },
  },
});
```

### 2.4 Configure `eas.json`

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_API_URL": "http://YOUR_LOCAL_IP:3001" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_API_URL": "https://api-staging.mynivas.com" }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "resourceClass": "m-medium" },
      "env": { "EXPO_PUBLIC_API_URL": "https://api.mynivas.com" }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services-key.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 3. API Client Setup

### `src/api/client.ts`

```typescript
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../store/auth.store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 with refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");

      const response = await axios.post(`${BASE_URL}/v1/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      await SecureStore.setItemAsync("accessToken", accessToken);
      await SecureStore.setItemAsync("refreshToken", newRefreshToken);
      useAuthStore.getState().setAccessToken(accessToken);

      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Standard error extractor
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? "An unexpected error occurred";
  }
  return "Network error. Check your connection.";
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError(error)) {
    const details = error.response?.data?.error?.details ?? [];
    return Object.fromEntries(
      details.filter((d: { field?: string }) => d.field).map((d: { field: string; issue: string }) => [d.field, d.issue])
    );
  }
  return {};
}
```

---

## 4. Auth Store (`src/store/auth.store.ts`)

```typescript
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export interface AuthUser {
  id: string;
  tenantId: string;
  communityId: string;
  roles: string[];
  phone: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setSession: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  setAccessToken: (token: string) => void;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync("accessToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);
    await SecureStore.setItemAsync("user", JSON.stringify(user));
    set({ user, accessToken, isAuthenticated: true });
  },

  setAccessToken: (token) => set({ accessToken: token }),

  logout: async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("user");
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  loadSession: async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync("accessToken"),
        SecureStore.getItemAsync("user"),
      ]);
      if (token && userJson) {
        set({ user: JSON.parse(userJson), accessToken: token, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  hasRole: (role) => get().user?.roles.includes(role) ?? false,
  hasAnyRole: (roles) => get().user?.roles.some((r) => roles.includes(r)) ?? false,
}));
```

---

## 5. Theme (`src/theme/index.ts`)

```typescript
export const theme = {
  colors: {
    primary:     "#1B4F72",   // Deep navy — brand primary
    secondary:   "#2E86C1",   // Blue — interactive elements
    accent:      "#F39C12",   // Amber — highlights, warnings
    success:     "#27AE60",   // Green — confirmed, resolved
    danger:      "#E74C3C",   // Red — urgent, error
    warning:     "#F39C12",   // Amber — pending, caution
    info:        "#2980B9",   // Blue — info states
    background:  "#F8F9FA",   // Off-white page bg
    surface:     "#FFFFFF",   // Card/modal bg
    border:      "#DEE2E6",   // Dividers
    textPrimary:   "#212529",
    textSecondary: "#6C757D",
    textDisabled:  "#ADB5BD",
  },
  status: {
    // Complaints
    NEW:         "#3498DB",
    ASSIGNED:    "#9B59B6",
    IN_PROGRESS: "#F39C12",
    RESOLVED:    "#27AE60",
    CLOSED:      "#95A5A6",
    // Bookings
    PENDING:     "#F39C12",
    CONFIRMED:   "#27AE60",
    REJECTED:    "#E74C3C",
    CANCELLED:   "#95A5A6",
    COMPLETED:   "#1ABC9C",
    // Visitors
    APPROVED:    "#27AE60",
    CHECKED_IN:  "#3498DB",
    CHECKED_OUT: "#95A5A6",
    AUTO_CLOSED: "#95A5A6",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  fontSize: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, xxxl: 30 },
  fontWeight: { regular: "400", medium: "500", semibold: "600", bold: "700" },
};
```

---

## 6. Root Layout (`app/_layout.tsx`)

```tsx
import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";
import { useAuthStore } from "../src/store/auth.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error: any) => error?.response?.status !== 403 && count < 3,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const { loadSession, isLoading } = useAuthStore();

  useEffect(() => { loadSession(); }, []);

  if (isLoading) return <SplashScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </QueryClientProvider>
  );
}
```

---

## 7. Backend Health Check Test

Create `app/test-connection.tsx` temporarily to verify API connectivity:

```tsx
// Remove this file after Phase 01 verification
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { apiClient } from "../src/api/client";

export default function TestScreen() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    apiClient.get("/health")
      .then(r => setStatus(`✅ Connected: ${r.data.status}`))
      .catch(e => setStatus(`❌ Error: ${e.message}`));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{status}</Text>
    </View>
  );
}
```

---

## 8. EAS Build Setup

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Initialize EAS in project
eas init

# Build development APK (for device testing)
eas build --platform android --profile development

# The APK download link appears in terminal
# Install on device: adb install <downloaded.apk>
```

---

## 9. Acceptance Criteria

| Check | Test |
|---|---|
| `npx expo start` | Opens on emulator without error |
| API health check | Returns `{ status: "ok" }` in TestScreen |
| TypeScript | `npx tsc --noEmit` → 0 errors |
| Android build | `eas build --platform android --profile preview` completes |
| iOS build | `eas build --platform ios --profile preview` completes |
| Theme imported | `theme.colors.primary` resolves correctly |
| Auth store | `useAuthStore` creates and persists correctly |

---

## 10. Next Phase Prerequisites

Before starting Phase 02:
- [ ] Project initialised and running on emulator
- [ ] `src/api/client.ts` complete with interceptors
- [ ] `src/store/auth.store.ts` complete
- [ ] `src/theme/index.ts` complete
- [ ] Folder structure matches `phases-index.md`
- [ ] EAS `eas.json` configured with correct bundle IDs
- [ ] Backend API gateway URL configured in `app.config.ts`
