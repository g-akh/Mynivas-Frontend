/**
 * Login screen — Phase 02 will implement full OTP flow.
 * Phase 01: health check verification only.
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { apiClient } from "../../src/api/client";
import { theme } from "../../src/theme";

export default function LoginScreen() {
  const [apiStatus, setApiStatus] = useState<
    "checking" | "ok" | "error"
  >("checking");
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    // Phase 01: verify API gateway is reachable
    apiClient
      .get("/health")
      .then((r) => {
        setApiStatus("ok");
        setApiMessage(
          `✅ Backend connected: ${JSON.stringify(r.data)}`
        );
      })
      .catch((err) => {
        setApiStatus("error");
        setApiMessage(`❌ ${err.message}`);
      });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>MyNivas</Text>
        <Text style={styles.tagline}>Society Management Platform</Text>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>API Status</Text>
        {apiStatus === "checking" ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <Text
            style={[
              styles.statusText,
              apiStatus === "ok" ? styles.ok : styles.err,
            ]}
          >
            {apiMessage}
          </Text>
        )}
      </View>

      <Text style={styles.hint}>
        Phase 01 — Setup & Architecture{"\n"}
        Full login UI implemented in Phase 02
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.xxl,
  },
  logoText: {
    fontSize: theme.fontSize.display,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statusBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: "100%",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    ...theme.shadow.sm,
  },
  statusLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontWeight: theme.fontWeight.medium,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    textAlign: "center",
  },
  ok: { color: theme.colors.success },
  err: { color: theme.colors.danger },
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textDisabled,
    textAlign: "center",
    lineHeight: 18,
  },
});
