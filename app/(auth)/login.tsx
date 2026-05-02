/**
 * LoginScreen — Phase 02
 * POST /v1/auth/request-otp
 */
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import PhoneInput from "../../src/components/forms/PhoneInput";
import LoadingButton from "../../src/components/common/LoadingButton";
import { requestOtp } from "../../src/api/auth";
import { showToast } from "../../src/store/ui.store";
import { getErrorMessage } from "../../src/api/client";
import { theme } from "../../src/theme";

const E164_REGEX = /^\+[1-9]\d{9,14}$/;

export default function LoginScreen() {
  const [phone, setPhone] = useState("+91");
  const [phoneError, setPhoneError] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => requestOtp(phone),
    onSuccess: (data) => {
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { sessionId: data.sessionId, phone, expiresAt: data.expiresAt },
      } as any);
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      if (status === 429) {
        showToast({ type: "warning", message: "Too many attempts. Try again in 60 seconds." });
      } else {
        showToast({ type: "error", message: getErrorMessage(err) });
      }
    },
  });

  const handleSendOTP = () => {
    setPhoneError("");
    if (!E164_REGEX.test(phone)) {
      setPhoneError("Enter a valid 10-digit mobile number");
      return;
    }
    mutate();
  };

  const isValid = E164_REGEX.test(phone);

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
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetter}>M</Text>
            </View>
            <Text style={styles.appName}>MyNivas</Text>
            <Text style={styles.tagline}>Society Management Platform</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>
              Enter your registered mobile number to continue
            </Text>

            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Mobile Number</Text>
              <PhoneInput
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  setPhoneError("");
                }}
                error={phoneError}
                disabled={isPending}
                testID="phone-input"
              />
            </View>

            <LoadingButton
              title="Send OTP"
              loadingTitle="Sending…"
              onPress={handleSendOTP}
              isLoading={isPending}
              disabled={!isValid}
              style={styles.btn}
              testID="send-otp-btn"
            />

            <Text style={styles.terms}>
              By continuing, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.primary },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },

  // Hero section (navy background)
  hero: {
    alignItems: "center",
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  logoLetter: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
    color: "#FFFFFF",
  },
  appName: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: theme.fontSize.sm,
    color: "rgba(255,255,255,0.75)",
    marginTop: theme.spacing.xs,
  },

  // White card at bottom
  card: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    ...theme.shadow.lg,
  },
  cardTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  fieldWrapper: { marginBottom: theme.spacing.xl },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  btn: { width: "100%", marginBottom: theme.spacing.lg },
  terms: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: { color: theme.colors.primary, fontWeight: theme.fontWeight.medium },
});
