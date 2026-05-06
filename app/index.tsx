/**
 * Splash/redirect screen.
 * Waits for session to load → routes to correct home or login.
 * phases-index.md: Role → Home Screen Mapping
 */
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/auth.store";
import { getHomeRoute } from "../src/utils/routing";
import { theme } from "../src/theme";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.surface} />
      </View>
    );
  }

  if (isAuthenticated && user) {
    return <Redirect href={getHomeRoute(user.roles) as any} />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
  },
});
