import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { theme } from "../../theme";

export type ButtonVariant = "primary" | "secondary" | "danger" | "outline";

interface LoadingButtonProps {
  title: string;
  loadingTitle?: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const VARIANTS: Record<
  ButtonVariant,
  { bg: string; text: string; border?: string }
> = {
  primary:   { bg: theme.colors.primary,   text: "#FFFFFF" },
  secondary: { bg: theme.colors.secondary, text: "#FFFFFF" },
  danger:    { bg: theme.colors.danger,    text: "#FFFFFF" },
  outline:   { bg: "transparent", text: theme.colors.primary, border: theme.colors.primary },
};

export default function LoadingButton({
  title,
  loadingTitle,
  onPress,
  isLoading = false,
  disabled = false,
  variant = "primary",
  style,
  textStyle,
  testID,
}: LoadingButtonProps) {
  const v = VARIANTS[variant];
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        { backgroundColor: v.bg },
        v.border ? { borderWidth: 1.5, borderColor: v.border } : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? theme.colors.primary : "#FFFFFF"}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          { color: v.text },
          isLoading ? styles.textWithSpinner : null,
          textStyle,
        ]}
      >
        {isLoading && loadingTitle ? loadingTitle : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  disabled: { opacity: 0.55 },
  text: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  textWithSpinner: { marginLeft: theme.spacing.sm },
});
