# Phase 18 — Production Build (Android APK/AAB + iOS IPA)

**Status:** TODO  
**Estimated Time:** 2–3 days  
**Depends on:** Phase 17 (all tests passing)  

---

## 1. Pre-Build Checklist

Before triggering a production build:

- [ ] All environment variables set in EAS secret store
- [ ] `EXPO_PUBLIC_API_URL` = `https://api.mynivas.com`
- [ ] `app.config.ts` version bumped (e.g., `1.0.0`)
- [ ] Android `package` = `com.mynivas.app`
- [ ] iOS `bundleIdentifier` = `com.mynivas.app`
- [ ] `eas.json` production profile correct
- [ ] Google Services JSON / GoogleService-Info.plist added for FCM
- [ ] APNS key uploaded to EAS for iOS push
- [ ] All E2E tests passing
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Splash screen + icon assets at correct sizes

---

## 2. Asset Requirements

**App Icon:**
- `assets/icon.png` — 1024×1024 PNG (no transparency)
- `assets/adaptive-icon.png` — 1024×1024 PNG (Android adaptive foreground)

**Splash Screen:**
- `assets/splash.png` — 1284×2778 PNG (iPhone 14 Pro Max size)
- Background: `#1B4F72` (navy)
- Logo centered

---

## 3. Environment Variables (EAS Secrets)

```bash
# Set in EAS — never commit to repo
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.mynivas.com"
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
```

---

## 4. Build Commands

### Android APK (for direct installation / testing)
```bash
eas build --platform android --profile preview
# Downloads: mynivas-preview.apk
# Install: adb install mynivas-preview.apk
```

### Android AAB (for Play Store)
```bash
eas build --platform android --profile production
# Downloads: mynivas.aab
# Upload to Play Console → Internal Testing → Production
```

### iOS IPA (for App Store / TestFlight)
```bash
eas build --platform ios --profile production
# Downloads: mynivas.ipa
# Submit: eas submit --platform ios
```

### Both platforms simultaneously
```bash
eas build --platform all --profile production
```

---

## 5. Android Play Store Submission

```bash
# Auto-submit after build
eas submit --platform android --latest

# Or manually:
# 1. Download .aab from EAS dashboard
# 2. Go to play.google.com/console
# 3. Create new app: "MyNivas"
# 4. Upload .aab to Internal Testing track
# 5. Add test users (your Gmail accounts)
# 6. After testing → promote to Production
```

**Play Store listing:**
- App name: MyNivas
- Category: Lifestyle / House & Home
- Short description (80 chars): "Manage your residential society — complaints, visitors, amenities & more"
- Full description: (from PRD product description)
- Screenshots: 4–8 screenshots per device size
- Feature graphic: 1024×500 PNG

---

## 6. iOS App Store / TestFlight Submission

```bash
eas submit --platform ios --latest
```

**Requirements:**
- Apple Developer account ($99/year)
- App Store Connect listing created
- Privacy policy URL (required by Apple)
- App Review information (demo account credentials)

---

## 7. OTA Updates (without app store resubmission)

For JS-only changes (no native code changes):
```bash
eas update --branch production --message "Fix visitor approval flow"
# Users get the update silently in background
# No app store review needed for JS updates
```

**`app.config.ts` OTA config:**
```typescript
updates: {
  enabled: true,
  fallbackToCacheTimeout: 0,
  url: "https://u.expo.dev/YOUR_PROJECT_ID",
},
runtimeVersion: {
  policy: "sdkVersion",  // OTA updates within same SDK version
},
```

---

## 8. CI/CD for Frontend (GitHub Actions)

**`.github/workflows/mobile-ci.yml`:**
```yaml
name: Mobile CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm test -- --coverage

  build-preview:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform android --profile preview --non-interactive
```

---

## 9. Version Management

```typescript
// Bump before each release:
// app.config.ts
version: "1.0.1",            // User-visible version
buildNumber: "2",            // iOS build number (integer)
versionCode: 2,              // Android version code (integer)
```

Semantic versioning:
- `1.0.0` → initial launch
- `1.0.x` → bug fixes (OTA update)
- `1.x.0` → new features (store submission)
- `x.0.0` → breaking changes (store submission)

---

## 10. Acceptance Criteria

| Check | Required |
|---|---|
| Android APK installs cleanly | ✅ |
| Android AAB passes Play Store review | ✅ |
| iOS IPA passes App Store review | ✅ |
| Push notifications work in production build | ✅ |
| API URL points to production (`api.mynivas.com`) | ✅ |
| No debug logs in production | ✅ |
| OTA update deployed and received by test device | ✅ |
| App opens in < 3 seconds on P0 devices | ✅ |
