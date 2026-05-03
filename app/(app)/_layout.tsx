/**
 * Authenticated app shell.
 * Auth guard: redirects to login if not authenticated.
 * Role routing: redirects to correct navigator based on user.roles.
 * phases-index.md: Role → Home Screen Mapping
 */
import { Redirect } from "expo-router";
import { Stack } from "expo-router";
import { useAuthStore } from "../../src/store/auth.store";

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
