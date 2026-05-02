import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUIStore } from "../../store/ui.store";
import { theme } from "../../theme";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  rightAction?: { icon: string; onPress: () => void; testID?: string };
}

export default function AppHeader({
  title,
  showBack = false,
  showNotifications = true,
  showProfile = true,
  rightAction,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const unreadCount = useUIStore((s) => s.unreadCount);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        {/* Left: back button or spacer */}
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="header-back"
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}

        {/* Center: title */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Right: notifications + profile or custom action */}
        <View style={styles.rightGroup}>
          {rightAction ? (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={styles.iconBtn}
              testID={rightAction.testID}
            >
              <MaterialIcons
                name={rightAction.icon as any}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ) : (
            <>
              {showNotifications ? (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => router.push("/(app)/notifications" as any)}
                  testID="header-notifications"
                >
                  <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
                  {unreadCount > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ) : null}

              {showProfile ? (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => router.push("/(app)/profile" as any)}
                  testID="header-profile"
                >
                  <MaterialIcons name="account-circle" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
    ...theme.shadow.sm,
  },
  inner: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.danger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: theme.fontWeight.bold,
  },
});
