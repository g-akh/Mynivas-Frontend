# MyNivas Mobile App

React Native + Expo mobile application for the MyNivas residential society management platform.

**Platforms:** Android (APK/AAB) + iOS (IPA)  
**Backend API:** https://api.mynivas.com  
**Backend Repo:** https://github.com/g-akh/mynivas  

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Press 'a' for Android emulator, 'i' for iOS simulator
```

## Build APK

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

## Development Plan

All phases are documented in the `/tasks` folder. Start with [tasks/phases-index.md](./tasks/phases-index.md).

| Phase | Status |
|---|---|
| 01 — Setup & Architecture | TODO |
| 02 — Authentication | TODO |
| 03 — Navigation | TODO |
| 04–16 — Feature Modules | TODO |
| 17 — Testing | TODO |
| 18 — Production Build | TODO |

## User Roles

- `RESIDENT` — complaints, visitors, bookings, documents
- `GUARD` — gate management
- `TECHNICIAN` — work orders
- `FM` — full operations dashboard
- `COMMUNITY_ADMIN` — community management
- `TENANT_ADMIN` — multi-community management
- `SUPER_ADMIN` — platform-wide admin
