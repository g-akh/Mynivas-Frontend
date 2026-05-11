/**
 * Resident Me / Profile screen
 */
import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuthStore } from "../../../src/store/auth.store";
import { useBookingList } from "../../../src/hooks/useAmenities";
import { useVisitorList } from "../../../src/hooks/useVisitors";
import { useComplaintList } from "../../../src/hooks/useComplaints";
import { theme } from "../../../src/theme";

/* ─── Menu item types ───────────────────────────────────────────────── */
interface MenuItem {
  icon: string;
  label: string;
  subtitle: string;
  route: string;
  iconBg: string;
  iconColor: string;
}

const ACCOUNT_ITEMS: MenuItem[] = [
  {
    icon: "home",
    label: "My residence",
    subtitle: "A-1204, Skyline Heights",
    route: "/(app)/(resident)/settings",
    iconBg:    "#E3F2FD",
    iconColor: theme.colors.primary,
  },
  {
    icon: "credit-card",
    label: "Payment methods",
    subtitle: "UPI · 2 cards",
    route: "/(app)/(resident)/billing",
    iconBg:    "#E3F2FD",
    iconColor: theme.colors.primary,
  },
  {
    icon: "notifications",
    label: "Notifications",
    subtitle: "Push, Email",
    route: "/(app)/(resident)/settings",
    iconBg:    "#E3F2FD",
    iconColor: theme.colors.primary,
  },
];

const PREF_ITEMS: MenuItem[] = [
  {
    icon: "shield",
    label: "Privacy & security",
    subtitle: "",
    route: "/(app)/(resident)/settings",
    iconBg:    "#E3F2FD",
    iconColor: theme.colors.primary,
  },
  {
    icon: "settings",
    label: "App settings",
    subtitle: "",
    route: "/(app)/(resident)/settings",
    iconBg:    "#E3F2FD",
    iconColor: theme.colors.primary,
  },
  {
    icon: "help-outline",
    label: "Help center",
    subtitle: "",
    route: "/(app)/(resident)/settings",
    iconBg:    "#E3F2FD",
    iconColor: theme.colors.primary,
  },
];

/* ─── Stat Card ─────────────────────────────────────────────────────── */
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>
        {typeof value === "number" ? String(value).padStart(2, "0") : value}
      </Text>
    </View>
  );
}

/* ─── Menu Group ────────────────────────────────────────────────────── */
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
          <View style={[s.menuIcon, { backgroundColor: item.iconBg }]}>
            <MaterialIcons name={item.icon as any} size={20} color={item.iconColor} />
          </View>
          <View style={s.menuText}>
            <Text style={s.menuLabel}>{item.label}</Text>
            {item.subtitle ? (
              <Text style={s.menuSubtitle}>{item.subtitle}</Text>
            ) : null}
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.colors.textDisabled} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────────── */
export default function ResidentMeScreen() {
  const { user, logout } = useAuthStore();

  const { data: bookings   = [] } = useBookingList();
  const { data: visitors   = [] } = useVisitorList();
  const { data: complaints = [] } = useComplaintList();

  const resolvedCount = complaints.filter((c: any) =>
    c.status === "RESOLVED" || c.status === "CLOSED"
  ).length;

  const initials = (user?.name ?? "MN")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const unitLabel = user?.unitId ?? "A-000";
  const role      = "Resident";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Gradient Profile Header ──────────────────────────── */}
        <LinearGradient
          colors={["#0D2766", "#1565C0", "#1976D2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          {/* Top nav row */}
          <View style={s.headerNav}>
            <TouchableOpacity
              style={s.headerIconBtn}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={s.headerNavTitle}>Profile</Text>
            <TouchableOpacity
              style={s.headerIconBtn}
              onPress={() => router.push("/(app)/(resident)/settings" as any)}
            >
              <MaterialIcons name="settings" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Avatar + info */}
          <View style={s.profileSection}>
            <View style={s.avatarSquare}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <Text style={s.profileName}>{user?.name ?? "Resident"}</Text>
            <Text style={s.profileRole}>{role} · {unitLabel}</Text>
            <View style={s.ratingRow}>
              <MaterialIcons name="star" size={16} color="#FFD740" />
              <Text style={s.ratingText}>4.9 community rating</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Stats Row ───────────────────────────────────────── */}
        <View style={s.statsContainer}>
          <StatCard label="Bookings"  value={bookings.length}   />
          <StatCard label="Visitors"  value={visitors.length}   />
          <StatCard label="Resolved"  value={resolvedCount}     />
        </View>

        {/* ── Content ─────────────────────────────────────────── */}
        <View style={s.content}>

          {/* Account section */}
          <Text style={s.sectionLabel}>Account</Text>
          <MenuGroup items={ACCOUNT_ITEMS} />

          {/* Preferences section */}
          <Text style={[s.sectionLabel, { marginTop: 24 }]}>Preferences</Text>
          <MenuGroup items={PREF_ITEMS} />

          {/* Logout */}
          <TouchableOpacity style={s.logoutBtn} onPress={() => logout()}>
            <MaterialIcons name="logout" size={18} color={theme.colors.danger} />
            <Text style={s.logoutText}>Log out</Text>
          </TouchableOpacity>

          {/* Version */}
          <Text style={s.version}>MyNivas v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },

  /* Header */
  header: { paddingBottom: 32 },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerNavTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },

  profileSection: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
  avatarSquare: {
    width: 84, height: 84, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 14,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
  },
  avatarText:   { fontSize: 32, fontWeight: "800", color: "#FFFFFF" },
  profileName:  { fontSize: 22, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.2 },
  profileRole:  { fontSize: 14, color: "rgba(255,255,255,0.78)", marginTop: 4 },
  ratingRow:    { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  ratingText:   { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },

  /* Stats */
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: -28,   // overlap the gradient
    zIndex: 10,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 14, padding: 14,
    alignItems: "flex-start",
    ...theme.shadow.md,
  },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "500", marginBottom: 6 },
  statValue: { fontSize: 26, fontWeight: "800", color: theme.colors.textPrimary },

  /* Content */
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 13, fontWeight: "700",
    color: theme.colors.textSecondary,
    marginBottom: 10, letterSpacing: 0.3,
  },

  /* Menu group */
  menuGroup: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1, borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  menuRow: {
    flexDirection: "row", alignItems: "center",
    gap: 14, paddingHorizontal: 16, paddingVertical: 15,
  },
  menuRowBorder: {
    borderBottomWidth: 1, borderBottomColor: theme.colors.background,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  menuText:     { flex: 1 },
  menuLabel:    { fontSize: 15, fontWeight: "600", color: theme.colors.textPrimary },
  menuSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },

  /* Logout */
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 28, paddingVertical: 15,
    borderRadius: 14, borderWidth: 1.5,
    borderColor: theme.colors.danger + "44",
    backgroundColor: theme.colors.danger + "08",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: theme.colors.danger },
  version:    { textAlign: "center", fontSize: 12, color: theme.colors.textDisabled, marginTop: 16 },
});
