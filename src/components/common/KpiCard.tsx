import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: string;
  urgent?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export default function KpiCard({
  label,
  value,
  icon,
  color = theme.colors.primary,
  urgent = false,
  onPress,
  style,
  testID,
}: KpiCardProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.card,
        urgent ? styles.urgentCard : null,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      testID={testID}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + "18" }]}>
        <MaterialIcons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.value, urgent ? styles.urgentValue : null]}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      {urgent && value !== 0 ? (
        <View style={styles.urgentDot} />
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: "flex-start",
    minHeight: 110,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  urgentCard: {
    borderColor: theme.colors.danger + "44",
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  value: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  urgentValue: { color: theme.colors.danger },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    lineHeight: 16,
  },
  urgentDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.danger,
  },
});
