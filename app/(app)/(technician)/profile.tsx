/**
 * Technician Profile — Phase 16
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../src/components/common/AppHeader";
import { useAuthStore } from "../../../src/store/auth.store";
import { formatRole } from "../../../src/utils/format";
import { theme } from "../../../src/theme";

export default function TechnicianProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Profile" showNotifications={false} showProfile={false} />
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "T"}
            </Text>
          </View>
          <Text style={s.userName}>{user?.name ?? "Technician"}</Text>
          <Text style={s.userPhone}>{user?.phone ?? ""}</Text>
        </View>

        {/* Role badges */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>Roles</Text>
          <View style={s.rolesRow}>
            {user?.roles.map((role) => (
              <View key={role} style={s.roleBadge}>
                <Text style={s.roleBadgeText}>{formatRole(role)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Community */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>Community</Text>
          <View style={s.infoRow}>
            <MaterialIcons name="location-city" size={18} color={theme.colors.textSecondary} />
            <Text style={s.infoValue}>
              #{user?.communityId?.slice(-8)?.toUpperCase() ?? "N/A"}
            </Text>
          </View>
        </View>

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
  avatarSection: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#9B59B6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    ...theme.shadow.md,
  },
  avatarText: { fontSize: 32, fontWeight: theme.fontWeight.bold, color: "#FFFFFF" },
  userName: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  userPhone: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 4 },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  infoTitle: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, color: theme.colors.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: theme.spacing.sm },
  rolesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    backgroundColor: "#9B59B615",
    borderWidth: 1,
    borderColor: "#9B59B644",
  },
  roleBadgeText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, color: "#9B59B6" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoValue: { fontSize: theme.fontSize.sm, color: theme.colors.textPrimary },
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
