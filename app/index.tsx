/**
 * Splash/redirect screen.
 * Waits for session to load → routes to correct home or login.
 * phases-index.md: Role → Home Screen Mapping
 */
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../src/store/auth.store";
import { routeByRole } from "../src/utils/routing";
import { theme } from "../src/theme";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      routeByRole(user.roles);
    } else {
      router.replace("/(auth)/login");
    }
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.surface} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
  },
});
