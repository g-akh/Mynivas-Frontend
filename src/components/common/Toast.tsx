import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useUIStore } from "../../store/ui.store";
import { theme } from "../../theme";

const TOAST_COLORS = {
  success: { bg: "#D4EDDA", border: "#27AE60", text: "#155724", icon: "check-circle" },
  error:   { bg: "#F8D7DA", border: "#E74C3C", text: "#721C24", icon: "error" },
  warning: { bg: "#FFF3CD", border: "#F39C12", text: "#856404", icon: "warning" },
  info:    { bg: "#D1ECF1", border: "#2980B9", text: "#0C5460", icon: "info" },
} as const;

function SingleToast({
  id,
  type,
  message,
}: {
  id: string;
  type: keyof typeof TOAST_COLORS;
  message: string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const dismiss = useUIStore((s) => s.dismissToast);
  const colors = TOAST_COLORS[type];

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: colors.bg, borderLeftColor: colors.border, opacity },
      ]}
    >
      <MaterialIcons
        name={colors.icon as any}
        size={20}
        color={colors.border}
        style={styles.icon}
      />
      <Text style={[styles.message, { color: colors.text }]} numberOfLines={3}>
        {message}
      </Text>
      <TouchableOpacity onPress={() => dismiss(id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <MaterialIcons name="close" size={18} color={colors.text} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Toast() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((t) => (
        <SingleToast key={t.id} {...t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 9999,
    gap: theme.spacing.sm,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    padding: theme.spacing.md,
    ...theme.shadow.md,
  },
  icon: { marginRight: theme.spacing.sm },
  message: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
    marginRight: theme.spacing.sm,
  },
});
