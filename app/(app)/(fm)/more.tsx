/**
 * FM More Menu — Phase 08
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import AppHeader from "../../../src/components/common/AppHeader";
import { useAuthStore } from "../../../src/store/auth.store";
import { theme } from "../../../src/theme";

interface MenuItem {
  icon: string;
  label: string;
  subtitle: string;
  route: string;
  color: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    icon: "event-seat",
    label: "Amenities",
    subtitle: "Manage facilities & bookings",
    route: "/(app)/(fm)/amenities",
    color: "#3498DB",
  },
  {
    icon: "folder",
    label: "Documents",
    subtitle: "Community documents & files",
    route: "/(app)/(fm)/reports",
    color: "#9B59B6",
  },
  {
    icon: "bar-chart",
    label: "Reports",
    subtitle: "Analytics & insights",
    route: "/(app)/(fm)/reports",
    color: "#27AE60",
  },
  {
    icon: "build",
    label: "PPM",
    subtitle: "Planned preventive maintenance",
    route: "/(app)/(fm)/work-orders",
    color: "#E67E22",
  },
  {
    icon: "settings",
    label: "Settings",
    subtitle: "App & community settings",
    route: "/(app)/profile",
    color: theme.colors.textSecondary,
  },
];

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <TouchableOpacity
      style={s.menuCard}
      onPress={() => router.push(item.route as any)}
      activeOpacity={0.7}
    >
      <View style={[s.iconBox, { backgroundColor: item.color + "18" }]}>
        <MaterialIcons name={item.icon as any} size={26} color={item.color} />
      </View>
      <View style={s.menuTextBox}>
        <Text style={s.menuLabel}>{item.label}</Text>
        <Text style={s.menuSubtitle}>{item.subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={theme.colors.textDisabled} />
    </TouchableOpacity>
  );
}

export default function FMMoreScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="More" showNotifications={false} showProfile={false} />
      <ScrollView contentContainerStyle={s.scroll}>
        {/* User info */}
        <View style={s.userCard}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "F"}
            </Text>
          </View>
          <View>
            <Text style={s.userName}>{user?.name ?? "FM Manager"}</Text>
            <Text style={s.userRole}>Facility Manager</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Quick Access</Text>

        {MENU_ITEMS.map((item) => (
          <MenuCard key={item.label} item={item} />
        ))}

        <TouchableOpacity style={s.logoutBtn} onPress={() => logout()}>
          <MaterialIcons name="logout" size={20} color={theme.colors.danger} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.sm,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: "#FFFFFF" },
  userName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  userRole: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextBox: { flex: 1 },
  menuLabel: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  menuSubtitle: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: theme.spacing.xl,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.danger + "55",
    backgroundColor: theme.colors.danger + "10",
  },
  logoutText: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.danger },
});
