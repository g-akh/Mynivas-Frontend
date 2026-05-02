import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MyNivas",
  slug: "mynivas",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#1B4F72",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.mynivas.app",
    infoPlist: {
      NSCameraUsageDescription: "Used to scan QR codes for visitor passes",
      NSPhotoLibraryUsageDescription: "Used to upload documents",
      NSPhotoLibraryAddUsageDescription: "Used to save documents",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#1B4F72",
    },
    package: "com.mynivas.app",
    permissions: [
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.VIBRATE",
      "android.permission.USE_BIOMETRIC",
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#1B4F72",
        defaultChannel: "default",
      },
    ],
    "expo-secure-store",
    [
      "expo-document-picker",
      { iCloudContainerEnvironment: "Production" },
    ],
    [
      "expo-camera",
      { cameraPermission: "Allow MyNivas to access your camera for scanning QR codes." },
    ],
  ],
  scheme: "mynivas",
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001",
    eas: {
      projectId: "YOUR_EAS_PROJECT_ID",
    },
  },
});
