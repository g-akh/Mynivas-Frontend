import { Stack } from "expo-router";
import { Redirect } from "expo-router";
import { useAuthStore } from "../../src/store/auth.store";
import { routeByRole } from "../../src/utils/routing";
import { theme } from "../../src/theme";

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore();

  // Already logged in — redirect to role-appropriate home
  if (isAuthenticated && user) {
    routeByRole(user.roles);
    return null;
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
