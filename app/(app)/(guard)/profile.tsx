/**
 * Guard Profile — Purple design
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuthStore } from "../../../src/store/auth.store";
import { formatRole } from "../../../src/utils/format";
import { useVisitorList } from "../../../src/hooks/useVisitors";
import { guardTheme as g } from "../../../src/theme/guardTheme";

interface MenuItem {
  icon: string; label: string; subtitle: string; route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: "location-city",    label: "My Community",    subtitle: "View community details",    route: "/(app)/(guard)/gate" },
  { icon: "notifications",    label: "Notifications",   subtitle: "Push, Email",               route: "/(app)/(guard)/alerts" },
  { icon: "directions-walk",  label: "Patrol Logs",     subtitle: "View your patrol history",  route: "/(app)/(guard)/patrol" },
  { icon: "local-parking",    label: "Parking",         subtitle: "Manage parking slots",      route: "/(app)/(guard)/parking" },
  { icon: "history",          label: "Visitor History", subtitle: "Full visitor log",           route: "/(app)/(guard)/history" },
];

function MenuGroup({ items }: { items: MenuItem[] }) {
  return (
    <View style={s.menuGroup}>
      {items.map((item, idx) => (
        <TouchableOpacity
          key={item.label}
          style={[s.menuRow, idx < items.length - 1 && s.menuRowBorder]}
          onPress={() => router.push(item.route as any)}
          activeOpacity={0.7}
        >
          <View style={s.menuIcon}>
            <MaterialIcons name={item.icon as any} size={20} color={g.colors.primary} />
          </View>
          <View style={s.menuText}>
            <Text style={s.menuLabel}>{item.label}</Text>
            {item.subtitle ? <Text style={s.menuSubtitle}>{item.subtitle}</Text> : null}
          </View>
          <MaterialIcons name="chevron-right" size={20} color={g.colors.textDisabled} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function GuardProfileScreen() {
  const { user, logout } = useAuthStore();

  const { data: allVisitors = [] } = useVisitorList();
  const todayVisitors = allVisitors.filter((v: any) => {
    const d = new Date(v.created_at);
    return d.toDateString() === new Date().toDateString();
  });
  const checkedInCount = allVisitors.filter((v: any) => v.status === "CHECKED_IN").length;

  const initials = (user?.name ?? "GD")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Gradient Header ──────────────────────────────────── */}
        <LinearGradient
          colors={["#49225B", "#6E3482", "#7B3F9A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          {/* Nav row */}
          <View style={s.headerNav}>
            <View style={s.headerIconBtn} />
            <Text style={s.headerNavTitle}>Profile</Text>
            <View style={s.headerIconBtn} />
          </View>

          {/* Avatar + info */}
          <View style={s.profileSection}>
            <View style={s.avatarSquare}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <Text style={s.profileName}>{user?.name ?? "Guard"}</Text>
            <View style={s.rolesRow}>
              {user?.roles.map((role) => (
                <View key={role} style={s.roleBadge}>
                  <Text style={s.roleBadgeText}>{formatRole(role)}</Text>
                </View>
              ))}
            </View>
            {user?.phone ? <Text style={s.profilePhone}>{user.phone}</Text> : null}
          </View>
        </LinearGradient>

        {/* ── Stats Row ─────────────────────────────────────────── */}
        <View style={s.statsContainer}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Today's Entries</Text>
            <Text style={s.statValue}>{String(todayVisitors.length).padStart(2, "0")}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Inside Now</Text>
            <Text style={s.statValue}>{String(checkedInCount).padStart(2, "0")}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Total Logged</Text>
            <Text style={s.statValue}>{String(allVisitors.length).padStart(2, "0")}</Text>
          </View>
        </View>

        <View style={s.content}>
          <Text style={s.sectionLabel}>Quick Access</Text>
          <MenuGroup items={MENU_ITEMS} />

          <TouchableOpacity style={s.logoutBtn} onPress={() => logout()}>
            <MaterialIcons name="logout" size={18} color={g.colors.danger} />
            <Text style={s.logoutText}>Log out</Text>
          </TouchableOpacity>

          <Text style={s.version}>MyNivas Guard v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: g.colors.background },

  header: { paddingBottom: 32 },
  headerNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  headerNavTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },
  headerIconBtn: { width: 36, height: 36 },

  profileSection: { alignItems: "center", paddingTop: 4, paddingBottom: 4 },
  avatarSquare: {
    width: 84, height: 84, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 14,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
  },
  avatarText:   { fontSize: 32, fontWeight: "800", color: "#FFFFFF" },
  profileName:  { fontSize: 22, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.2 },
  rolesRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 8 },
  roleBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
  },
  roleBadgeText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
  profilePhone:  { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 6 },

  statsContainer: {
    flexDirection: "row", paddingHorizontal: 16, gap: 10,
    marginTop: -28, zIndex: 10, marginBottom: 8,
  },
  statCard: {
    flex: 1, backgroundColor: g.colors.surface,
    borderRadius: 14, padding: 14,
    alignItems: "flex-start",
    borderWidth: 1, borderColor: g.colors.border,
    ...g.shadow.md,
  },
  statLabel: { fontSize: 11, color: g.colors.textSecondary, fontWeight: "500", marginBottom: 5 },
  statValue: { fontSize: 24, fontWeight: "800", color: g.colors.textPrimary },

  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 13, fontWeight: "700", color: g.colors.textSecondary,
    marginBottom: 10, letterSpacing: 0.3,
  },
  menuGroup: {
    backgroundColor: g.colors.surface, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: g.colors.border, ...g.shadow.sm,
  },
  menuRow: {
    flexDirection: "row", alignItems: "center",
    gap: 14, paddingHorizontal: 16, paddingVertical: 15,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: g.colors.background },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: g.colors.primaryLight + "22",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  menuText:    { flex: 1 },
  menuLabel:   { fontSize: 15, fontWeight: "600", color: g.colors.textPrimary },
  menuSubtitle:{ fontSize: 12, color: g.colors.textSecondary, marginTop: 2 },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 24, paddingVertical: 15, borderRadius: 14,
    borderWidth: 1.5, borderColor: g.colors.danger + "44",
    backgroundColor: g.colors.danger + "08",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: g.colors.danger },
  version:    { textAlign: "center", fontSize: 12, color: g.colors.textDisabled, marginTop: 14 },
});
