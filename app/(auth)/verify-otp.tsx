/**
 * OTP verification screen — full implementation in Phase 02.
 */
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../src/theme";

export default function VerifyOTPScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>OTP Screen — Phase 02</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
});
