import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUIStore } from "../../store/ui.store";
import { theme } from "../../theme";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  rightAction?: { icon: string; onPress: () => void; testID?: string };
  gradientColors?: [string, string, string];
}

export default function AppHeader({
  title,
  showBack = false,
  showNotifications = true,
  showProfile = true,
  rightAction,
  gradientColors = ["#0D2766", "#1565C0", "#1976D2"],
}: AppHeaderProps) {
  const insets       = useSafeAreaInsets();
  const unreadCount  = useUIStore((s) => s.unreadCount);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.inner}>
        {/* Left */}
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

        {/* Center */}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {/* Right */}
        <View style={styles.rightGroup}>
          {rightAction ? (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={styles.iconBtn}
              testID={rightAction.testID}
            >
              <MaterialIcons name={rightAction.icon as any} size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <>
              {showNotifications && (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => router.push("/(app)/notifications" as any)}
                  testID="header-notifications"
                >
                  <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              {showProfile && (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => router.push("/(app)/profile" as any)}
                  testID="header-profile"
                >
                  <View style={styles.avatarCircle}>
                    <MaterialIcons name="account-circle" size={26} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
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
    fontWeight: theme.fontWeight.bold,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  iconBtn: {
    width: 40, height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  rightGroup: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  badge: {
    position: "absolute", top: 4, right: 4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: "#FFD740",
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 2,
  },
  badgeText: { color: theme.colors.primaryDark, fontSize: 9, fontWeight: "800" },
});
