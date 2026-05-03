import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../theme";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const color =
    (theme.status as Record<string, string>)[status] ??
    (theme.priority as Record<string, string>)[status] ??
    theme.colors.textSecondary;

  const label = status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");

  return (
    <View
      style={[
        styles.badge,
        size === "sm" ? styles.sm : styles.md,
        { backgroundColor: color + "22", borderColor: color + "55" },
      ]}
    >
      <Text style={[styles.text, size === "sm" ? styles.smText : styles.mdText, { color }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  md: { paddingVertical: 3, paddingHorizontal: 10 },
  sm: { paddingVertical: 2, paddingHorizontal: 7 },
  text: { fontWeight: theme.fontWeight.semibold },
  mdText: { fontSize: theme.fontSize.xs },
  smText: { fontSize: 10 },
});
