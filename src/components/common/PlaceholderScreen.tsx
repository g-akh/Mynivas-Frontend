import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../theme";

interface Props { title: string; phase: string; }

export default function PlaceholderScreen({ title, phase }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🚧</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.phase}>Implemented in {phase}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: theme.colors.background, padding: theme.spacing.xl },
  emoji: { fontSize: 48, marginBottom: theme.spacing.md },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  phase: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
