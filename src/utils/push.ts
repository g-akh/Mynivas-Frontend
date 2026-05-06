import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { registerDevice } from "../api/auth";

// Lazy-load expo-notifications to avoid import-time crash in Expo Go (SDK 53+)
// Push notifications are only supported in development builds, not Expo Go.
let Notifications: typeof import("expo-notifications") | null = null;
try {
  if (Constants.executionEnvironment !== "storeClient") {
    Notifications = require("expo-notifications");
  } else {
    console.warn("[Push] Skipping expo-notifications in Expo Go");
  }
} catch {
  console.warn("[Push] expo-notifications not available");
}

// Configure how notifications appear when app is in foreground
try {
  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (err) {
  console.warn("[Push] Failed to set notification handler:", err);
}

/**
 * Request push permissions and register the FCM/APNS token with the backend.
 * Called immediately after successful login.
 */
export async function registerPushNotifications(
  userId: string
): Promise<void> {
  if (!Notifications) {
    console.log("[Push] Notifications not available — skipping registration");
    return;
  }

  // Skip in simulator/emulator — real device required for push
  if (!Device.isDevice) {
    console.log("[Push] Skipping push registration — not a physical device");
    return;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Push] Permission denied — notifications disabled");
    return;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const pushToken = tokenData.data;
    const platform = Platform.OS === "ios" ? "IOS" : "ANDROID";

    await registerDevice(userId, {
      deviceId: pushToken,
      platform,
      pushToken,
    });

    console.log("[Push] Device registered successfully");
  } catch (err) {
    console.warn("[Push] Failed to register device:", err);
  }
}

/**
 * Set up notification tap handler for deep linking.
 * Install once in root layout.
 */
export function setupNotificationHandlers(): () => void {
  if (!Notifications) {
    console.log("[Push] Notifications not available — skipping handler setup");
    return () => {};
  }

  try {
    const { router } = require("expo-router");
    const { useUIStore } = require("../store/ui.store");

    // Foreground: add to in-app notification store
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        useUIStore.getState().addNotification({
          title: title ?? "MyNivas",
          body: body ?? "",
          type: (data as any)?.type ?? "GENERAL",
          data: data as Record<string, unknown>,
        });
      }
    );

    // Background tap: deep link to correct screen
    const tapSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<
          string,
          string
        >;

        switch (data?.type) {
          case "BOOKING":
            router.push(`/(app)/(resident)/bookings/${data.id}`);
            break;
          case "COMPLAINT":
            router.push(`/(app)/(resident)/complaints/${data.id}`);
            break;
          case "VISITOR_APPROVAL":
            router.push(`/(app)/(resident)/visitors/approve/${data.id}`);
            break;
          case "VISITOR":
            router.push(`/(app)/(resident)/visitors/${data.id}`);
            break;
          case "BILLING":
            router.push(`/(app)/(resident)/billing`);
            break;
          case "AMENITY_SLOT_AVAILABLE":
            router.push(`/(app)/(resident)/bookings/new`);
            break;
          default:
            break;
        }
      }
    );

    // Return cleanup function
    return () => {
      foregroundSub.remove();
      tapSub.remove();
    };
  } catch (err) {
    console.warn("[Push] Failed to setup notification handlers:", err);
    return () => {};
  }
}
