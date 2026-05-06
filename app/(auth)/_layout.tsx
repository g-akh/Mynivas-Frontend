import { Stack } from "expo-router";
import { Redirect } from "expo-router";
import { useAuthStore } from "../../src/store/auth.store";
import { getHomeRoute } from "../../src/utils/routing";
import { theme } from "../../src/theme";

export default function AuthLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();

  // Already logged in — redirect to role-appropriate home
  if (isAuthenticated && user) {
    const homeRoute = getHomeRoute(user.roles);
    if (homeRoute === "/(auth)/login") {
      // User has no valid roles, clear session to break loop
      logout();
    } else {
      return <Redirect href={homeRoute as any} />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.headerText,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="verify-otp"
        options={{ headerTitle: "Verify OTP", headerShown: true }}
      />
    </Stack>
  );
}
