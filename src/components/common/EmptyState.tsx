import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LoadingButton from "./LoadingButton";
import { theme } from "../../theme";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ emoji, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <LoadingButton
          title={actionLabel}
          onPress={onAction}
          isLoading={false}
          style={styles.btn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: theme.spacing.xxl },
  emoji: { fontSize: 52, marginBottom: theme.spacing.lg },
  title: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary, textAlign: "center", marginBottom: theme.spacing.sm },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: theme.spacing.xl },
  btn: { width: 200 },
});
