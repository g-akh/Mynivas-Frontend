import { useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/store/auth.store";
import { setupNotificationHandlers } from "../src/utils/push";
import { theme } from "../src/theme";
import Toast from "../src/components/common/Toast";

// SplashScreen.preventAutoHideAsync(); // Removed to fix splash screen hang

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) =>
        error?.response?.status !== 403 &&
        error?.response?.status !== 401 &&
        failureCount < 3,
      staleTime: 30_000,
    },
  },
});

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
  },
};

export default function RootLayout() {
  const { loadSession } = useAuthStore();

  useEffect(() => {
    loadSession().catch((err) => {
      console.warn("[RootLayout] loadSession failed:", err);
    });

    let cleanup: (() => void) | undefined;
    try {
      cleanup = setupNotificationHandlers();
    } catch (err) {
      console.warn("[RootLayout] setupNotificationHandlers failed:", err);
    }
    return () => cleanup?.();
  }, []);

  // Removed onLayoutRootView to always render the app shell

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={paperTheme}>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            <Stack screenOptions={{ headerShown: false }} />
            <Toast />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
