/**
 * OTPScreen — Phase 02
 * POST /v1/auth/verify-otp
 */
import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import OTPInput, { OTPInputRef } from "../../src/components/forms/OTPInput";
import LoadingButton from "../../src/components/common/LoadingButton";
import { verifyOtp, requestOtp } from "../../src/api/auth";
import { useAuthStore } from "../../src/store/auth.store";
import { showToast } from "../../src/store/ui.store";
import { getErrorMessage } from "../../src/api/client";
import { routeByRole } from "../../src/utils/routing";
import { registerPushNotifications } from "../../src/utils/push";
import { formatPhone } from "../../src/utils/format";
import { theme } from "../../src/theme";

const RESEND_SECONDS = 30;

export default function VerifyOTPScreen() {
  const { sessionId, phone, expiresAt, devOtp } = useLocalSearchParams<{
    sessionId: string;
    phone: string;
    expiresAt: string;
    devOtp?: string;
  }>();

  const otpRef = useRef<OTPInputRef>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId ?? "");

  const { setSession } = useAuthStore();

  // ── Resend countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Verify OTP mutation ─────────────────────────────────────────────────
  const verifyMutation = useMutation({
    mutationFn: (otpOverride?: string) => verifyOtp(currentSessionId, otpOverride ?? otp),
    onSuccess: async (data) => {
      await setSession(data.user, data.accessToken, data.refreshToken);
      await registerPushNotifications(data.user.id);
      routeByRole(data.user.roles);
    },
    onError: (err: any) => {
      setOtpError(true);
      otpRef.current?.clear();
      const status = err?.response?.status;
      if (status === 401) {
        showToast({ type: "error", message: "OTP expired. Tap Resend to get a new one." });
      } else if (status === 429) {
        showToast({ type: "warning", message: "Too many attempts. Request a new OTP." });
      } else {
        showToast({ type: "error", message: "Incorrect OTP. Please try again." });
      }
    },
  });

  // ── Resend OTP mutation ─────────────────────────────────────────────────
  const resendMutation = useMutation({
    mutationFn: () => requestOtp(phone ?? ""),
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
      setCountdown(RESEND_SECONDS);
      setOtpError(false);
      otpRef.current?.clear();
      showToast({ type: "success", message: "New OTP sent!" });
    },
    onError: (err) => showToast({ type: "error", message: getErrorMessage(err) }),
  });

  // ── DEV: auto-submit OTP when DEV_OTP_ECHO provides it ───────────────
  useEffect(() => {
    if (devOtp && devOtp.length === 6) {
      setOtp(devOtp);
      setTimeout(() => verifyMutation.mutate(devOtp), 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devOtp]);

  const handleOTPComplete = (code: string) => {
    setOtp(code);
    setOtpError(false);
    // Auto-submit with code directly (state may not be updated yet)
    verifyMutation.mutate(code);
  };

  const isLoading = verifyMutation.isPending || resendMutation.isPending;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>📱</Text>
            </View>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to
            </Text>
            <Text style={styles.phone}>{formatPhone(phone ?? "")}</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Enter 6-digit OTP</Text>

            <OTPInput
              ref={otpRef}
              length={6}
              onComplete={handleOTPComplete}
              disabled={isLoading}
              error={otpError}
              testID="otp-input"
            />

            {otpError ? (
              <Text style={styles.errorText}>Incorrect OTP. Please try again.</Text>
            ) : null}

            <LoadingButton
              title="Verify OTP"
              loadingTitle="Verifying…"
              onPress={() => {
                if (otp.length === 6) verifyMutation.mutate();
              }}
              isLoading={verifyMutation.isPending}
              disabled={otp.length < 6 || isLoading}
              style={styles.btn}
              testID="verify-btn"
            />

            {/* Resend */}
            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn't receive it? </Text>
              {countdown > 0 ? (
                <Text style={styles.resendCountdown}>
                  Resend in {countdown}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={() => resendMutation.mutate()}
                  disabled={resendMutation.isPending}
                  testID="resend-btn"
                >
                  <Text style={styles.resendLink}>
                    {resendMutation.isPending ? "Sending…" : "Resend OTP"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Change number */}
            <TouchableOpacity
              style={styles.changeNumberBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.changeNumberText}>
                Change mobile number
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.primary },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "flex-end" },

  header: {
    alignItems: "center",
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  iconEmoji: { fontSize: 32 },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: "#FFFFFF",
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: "rgba(255,255,255,0.75)",
  },
  phone: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: "#FFFFFF",
    marginTop: theme.spacing.xs,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    ...theme.shadow.lg,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  btn: { marginTop: theme.spacing.xl, width: "100%" },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.lg,
  },
  resendLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  resendCountdown: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textDisabled,
    fontWeight: theme.fontWeight.medium,
  },
  resendLink: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  changeNumberBtn: {
    marginTop: theme.spacing.md,
    alignItems: "center",
    padding: theme.spacing.sm,
  },
  changeNumberText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textDecorationLine: "underline",
  },
});
