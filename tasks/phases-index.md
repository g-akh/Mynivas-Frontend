# MyNivas Mobile App — Frontend Development Plan
**Repo:** https://github.com/g-akh/Mynivas-Frontend  
**Platform:** React Native + Expo (Android + iOS)  
**Backend Spec:** `docs/frontend-specification.md` in mynivas backend repo  
**API Gateway:** `https://api.mynivas.com` (prod) / `http://localhost:3001` (dev)  
**Last Updated:** 2026-05-03  

---

## Scope

Single mobile application serving ALL user roles:
- `SUPER_ADMIN` — tenant & platform management
- `TENANT_ADMIN` — community + user management
- `COMMUNITY_ADMIN` — full community ops
- `FM` (Facility Manager) — operations dashboard
- `TECHNICIAN` — work orders only
- `GUARD` — visitor gate management
- `RESIDENT` — self-service (complaints, visitors, bookings, documents)

Navigation and screens shown are role-filtered automatically after login.

---

## Phase Overview & Dependencies

```
Phase 01 ──► Phase 02 ──► Phase 03 ──► Phase 04 ──► Phase 05
 Setup       Auth         Navigation   Home/Dash    Complaints

Phase 05 ──► Phase 06 ──► Phase 07 ──► Phase 08 ──► Phase 09
 Complaints  Visitors     Work Orders  Amenities    Documents

Phase 09 ──► Phase 10 ──► Phase 11 ──► Phase 12 ──► Phase 13
 Documents   Reports      Admin Panel  Notifications Settings

Phase 13 ──► Phase 14 ──► Phase 15 ──► Phase 16 ──► Phase 17
 Settings    Billing      Plans        Testing       Production Build
```

---

## Phase Index

| # | File | Title | Screens | Status |
|---|---|---|---|---|
| 01 | [phase-01-setup.md](./phase-01-setup.md) | Project Setup & Architecture | 0 screens, foundational | ✅ DONE |
| 02 | [phase-02-authentication.md](./phase-02-authentication.md) | Authentication & Session | Login + OTP Verify | ✅ DONE |
| 03 | [phase-03-navigation.md](./phase-03-navigation.md) | Navigation & Role Routing | Root shell + role routing | ✅ DONE |
| 04 | [phase-04-home-dashboard.md](./phase-04-home-dashboard.md) | Home Screen & FM Dashboard | Resident home + FM dashboard | ✅ DONE |
| 05 | [phase-05-complaints.md](./phase-05-complaints.md) | Complaints / Helpdesk | Resident list/new + FM board | ✅ DONE |
| 06 | [phase-06-visitors.md](./phase-06-visitors.md) | Visitor Management + Gate | Pre-register, passes (QR), gate dashboard, history | ✅ DONE |
| 07 | [phase-07-announcements.md](./phase-07-announcements.md) | Announcements & Polls | Feed, detail, create wizard | ✅ DONE |
| 08 | [phase-08-work-orders-ppm.md](./phase-08-work-orders-ppm.md) | Work Orders & PPM | FM list, technician tasks, PPM assets | ✅ DONE |
| 09 | [phase-09-amenities.md](./phase-09-amenities.md) | Amenity Booking | Browse, calendar, book, approvals | ✅ DONE |
| 10 | [phase-10-documents.md](./phase-10-documents.md) | Document Management | Library, search, download, upload | ✅ DONE |
| 11 | [phase-11-reports.md](./phase-11-reports.md) | Reports & Analytics | 4-tab analytics + CSV export | ✅ DONE |
| 12 | [phase-12-admin-panel.md](./phase-12-admin-panel.md) | Admin Panel | Tenants, communities, users, onboarding | ✅ DONE |
| 13 | [phase-13-notifications.md](./phase-13-notifications.md) | Push Notifications | In-app notification center | ✅ DONE |
| 14 | [phase-14-billing.md](./phase-14-billing.md) | Billing & Dues | Resident dues + FM collection dashboard | ✅ DONE |
| 15 | [phase-15-plans.md](./phase-15-plans.md) | Plans & Feature Gating | Subscription info, plan features | ✅ DONE |
| 16 | [phase-16-profile-settings.md](./phase-16-profile-settings.md) | Profile & Settings | Edit name, roles, settings, logout | ✅ DONE |
| 17 | [phase-17-testing.md](./phase-17-testing.md) | Testing | Unit tests (store, utils, auth screens) | ✅ DONE |
| 18 | [phase-18-production-build.md](./phase-18-production-build.md) | Production Build | EAS config, BUILD.md guide, eas.json | ✅ DONE |

**Total: 18 phases complete · ~80 screens · TypeScript strict zero errors**

---

## Technology Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React Native 0.74 + Expo SDK 51 | Single codebase → Android APK + iOS IPA |
| Language | TypeScript strict mode | Type safety with backend contracts |
| Navigation | Expo Router v3 (file-based) | App Router pattern, deep linking built-in |
| State | Zustand (auth) + React Query v5 (server state) | Minimal boilerplate, powerful caching |
| HTTP Client | Axios + custom interceptors | Token refresh, error normalization |
| UI Components | React Native Paper + custom theme | Material Design, platform-adaptive |
| Forms | React Hook Form + Zod | Matches backend Zod validation exactly |
| Charts | Victory Native XL | Performant charts for analytics |
| File Upload | Expo DocumentPicker + Expo ImagePicker | Native file/image selection |
| Push Notifications | Expo Notifications (FCM + APNS) | Cross-platform push |
| Storage | expo-secure-store (tokens) + MMKV (cache) | Secure token storage |
| Icons | Expo Vector Icons (MaterialIcons) | Comprehensive icon set |
| APK Build | Expo EAS Build | Cloud build, no Android Studio needed |

---

## API Base Configuration

```typescript
// All API calls go to gateway — never individual service ports
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

// Auth header on every request
Authorization: Bearer {accessToken}

// Token refresh on 401 → retry → redirect to login on failure
```

---

## Folder Structure (Target)

```
Mynivas-Frontend/
├── app/                          ← Expo Router screens (file = route)
│   ├── (auth)/                   ← Unauthenticated routes
│   │   ├── login.tsx
│   │   ├── verify-otp.tsx
│   │   └── _layout.tsx
│   ├── (app)/                    ← Authenticated routes
│   │   ├── (resident)/           ← Resident tab navigator
│   │   ├── (fm)/                 ← FM tab navigator
│   │   ├── (guard)/              ← Guard tab navigator
│   │   ├── (admin)/              ← Admin/Super Admin navigator
│   │   └── _layout.tsx           ← Role-based routing logic
│   ├── _layout.tsx               ← Root layout
│   └── index.tsx                 ← Splash/redirect
├── src/
│   ├── api/                      ← API service layer
│   │   ├── client.ts             ← Axios instance + interceptors
│   │   ├── auth.ts
│   │   ├── complaints.ts
│   │   ├── visitors.ts
│   │   ├── amenities.ts
│   │   ├── documents.ts
│   │   ├── announcements.ts
│   │   ├── workOrders.ts
│   │   ├── reports.ts
│   │   ├── billing.ts
│   │   └── index.ts
│   ├── components/               ← Reusable UI components
│   │   ├── common/
│   │   ├── forms/
│   │   └── charts/
│   ├── hooks/                    ← Custom React hooks
│   ├── store/                    ← Zustand stores
│   │   ├── auth.store.ts
│   │   └── ui.store.ts
│   ├── types/                    ← TypeScript types matching backend
│   ├── utils/                    ← Formatters, validators, helpers
│   └── theme/                    ← Colors, typography, spacing
├── assets/                       ← Images, fonts, icons
├── tasks/                        ← This folder (development plan)
├── app.config.ts
├── eas.json
└── package.json
```

---

## Role → Home Screen Mapping

After login, the app routes based on `user.roles[0]`:

| Role | Home Tab | Default Screen |
|---|---|---|
| `SUPER_ADMIN` | Admin | Tenant List |
| `TENANT_ADMIN` | Admin | Communities List |
| `COMMUNITY_ADMIN` | Dashboard | FM Dashboard |
| `FM` | Dashboard | FM Dashboard |
| `TECHNICIAN` | Work Orders | My Work Orders |
| `GUARD` | Gate | Gate Dashboard |
| `RESIDENT` | Home | Announcement Feed |

---

## Conventions for Phase Files

Each phase file uses status checkboxes:
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

When completing a screen, commit: `feat: P0X — <ScreenName> complete`
