# MyNivas — Production Build Guide

## Prerequisites

```bash
npm install -g eas-cli
eas login    # login with your Expo account
eas init     # links project to EAS — updates app.config.ts with projectId
```

## Android APK (Debug / Internal Testing)

```bash
# Development APK (includes dev client, connects to local backend)
eas build --platform android --profile development

# Preview APK (production-like, staging backend, internal distribution)
eas build --platform android --profile preview

# Download the .apk when build completes and install on device:
# Settings → Install from unknown sources → install .apk
```

## Android AAB (Google Play Store)

```bash
# Production AAB — submit to Play Store
eas build --platform android --profile production

# Then submit to Play Store:
eas submit --platform android --latest
```

## iOS IPA (TestFlight / App Store)

```bash
# Requires Apple Developer account ($99/year) + macOS for local builds
# EAS cloud build works on any OS:
eas build --platform ios --profile preview     # TestFlight
eas build --platform ios --profile production  # App Store
eas submit --platform ios --latest             # Submit to TestFlight
```

## Environment Variables per Build Profile

| Profile | `EXPO_PUBLIC_API_URL` |
|---|---|
| development | `http://YOUR_LOCAL_IP:3001` |
| preview | `https://api-staging.mynivas.com` |
| production | `https://api.mynivas.com` |

**Note:** Use your machine's LAN IP (not `localhost`) for the development build on a physical device.

## Over-the-Air Updates (OTA)

For minor JS-only fixes (no native code changes), use EAS Update:

```bash
# Push update to all production users
eas update --branch production --message "Fix booking cancel bug"

# Preview channel (for testing before production)
eas update --branch preview --message "Test new feature"
```

## Common Issues

| Issue | Fix |
|---|---|
| "Unable to connect to server" on device | Use LAN IP in `EXPO_PUBLIC_API_URL`, not `localhost` |
| Android build fails with Gradle error | Run `eas build --clear-cache --platform android` |
| iOS signing error | Run `eas credentials` and let EAS manage provisioning profiles |
| Push notifications not working | Physical device required; check FCM/APNS credentials in EAS secrets |
| White screen on launch | Check `app.json` scheme matches `eas.json` build config |

## Secrets Management (Production)

Store sensitive keys in EAS secrets (never in `.env` or `app.config.ts`):

```bash
eas secret:create --scope project --name WHATSAPP_ACCESS_TOKEN --value "your-token"
eas secret:create --scope project --name STORAGE_BUCKET --value "mynivas-prod-docs"
```

Access in `app.config.ts` via `process.env.WHATSAPP_ACCESS_TOKEN`.
