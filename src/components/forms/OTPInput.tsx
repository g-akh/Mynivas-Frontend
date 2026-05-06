import React, { useRef, useState, useImperativeHandle, forwardRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { theme } from "../../theme";

export interface OTPInputRef {
  clear: () => void;
  focus: () => void;
}

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
  error?: boolean;
  testID?: string;
}

const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(
  ({ length = 6, onComplete, disabled = false, error = false, testID }, ref) => {
    const [values, setValues] = useState<string[]>(Array(length).fill(""));
    const inputs = useRef<Array<TextInput | null>>([]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        setValues(Array(length).fill(""));
        inputs.current[0]?.focus();
      },
      focus: () => inputs.current[0]?.focus(),
    }));

    const handleChange = (text: string, index: number) => {
      const cleaned = text.replace(/\D/g, "");

      if (cleaned.length === 0) {
        const next = [...values];
        next[index] = "";
        setValues(next);
        return;
      }

      // Handle paste (full OTP pasted at once)
      if (cleaned.length >= length) {
        const digits = cleaned.slice(0, length);
        const next = Array(length).fill("");
        for (let i = 0; i < digits.length; i++) next[i] = digits[i];
        setValues(next);
        onComplete(digits);
        inputs.current[length - 1]?.blur();
        return;
      }

      // Multi-digit but less than full length (partial paste)
      if (cleaned.length > 1) {
        const next = [...values];
        for (let i = 0; i < cleaned.length && index + i < length; i++) {
          next[index + i] = cleaned[i];
        }
        setValues(next);
        const nextIndex = Math.min(index + cleaned.length, length - 1);
        inputs.current[nextIndex]?.focus();
        const joined = next.join("");
        if (joined.length === length && !next.includes("")) {
          onComplete(joined);
          inputs.current[length - 1]?.blur();
        }
        return;
      }

      // Single digit entry
      const digit = cleaned[0];
      const next = [...values];
      next[index] = digit;
      setValues(next);

      if (index < length - 1) {
        inputs.current[index + 1]?.focus();
      }

      const joined = next.join("");
      if (joined.length === length && !next.includes("")) {
        onComplete(joined);
        inputs.current[index]?.blur();
      }
    };

    const handleKeyPress = (
      e: NativeSyntheticEvent<TextInputKeyPressEventData>,
      index: number
    ) => {
      if (e.nativeEvent.key === "Backspace" && !values[index] && index > 0) {
        const next = [...values];
        next[index - 1] = "";
        setValues(next);
        inputs.current[index - 1]?.focus();
      }
    };

    return (
      <View style={styles.container} testID={testID}>
        {Array(length)
          .fill(0)
          .map((_, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              style={[
                styles.box,
                values[i] ? styles.filled : null,
                error ? styles.errorBox : null,
                disabled ? styles.disabledBox : null,
              ]}
              value={values[i]}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={Platform.OS === "android" ? 1 : 6}
              selectTextOnFocus
              editable={!disabled}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              testID={`otp-box-${i}`}
            />
          ))}
      </View>
    );
  }
);

OTPInput.displayName = "OTPInput";
export default OTPInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  box: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    textAlign: "center",
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  filled: {
    borderColor: theme.colors.primary,
    backgroundColor: "#EBF5FB",
  },
  errorBox: { borderColor: theme.colors.danger },
  disabledBox: { opacity: 0.5 },
});
