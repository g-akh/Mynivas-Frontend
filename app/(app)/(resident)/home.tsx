/**
 * Resident Home — Phase 04
 * GET /v1/announcements  (announcement feed)
 * GET /v1/visitors       (pending approvals)
 */
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput,
} from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { listAnnouncements, acknowledgeAnnouncement } from "../../../src/api/announcements";
import { useVisitorList, useApproveVisitor, useRejectVisitor } from "../../../src/hooks/useVisitors";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { formatRelative } from "../../../src/utils/format";
import { theme } from "../../../src/theme";
import type { Announcement } from "../../../src/types";

/* ─── Quick Actions ──────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { icon: "people",         label: "Visitors",   route: "/(app)/(resident)/visitors",   bg: "#26A69A" },
  { icon: "report-problem", label: "Complaints", route: "/(app)/(resident)/complaints", bg: "#0D2766" },
  { icon: "event",          label: "Bookings",   route: "/(app)/(resident)/bookings",   bg: "#00ACC1" },
  { icon: "folder",         label: "Documents",  route: "/(app)/(resident)/documents",  bg: "#1565C0" },
  { icon: "credit-card",    label: "Payments",   route: "/(app)/(resident)/billing",    bg: "#1A2F6B" },
  { icon: "campaign",       label: "Notices",    route: "/(app)/(resident)/notices",    bg: "#00897B" },
  { icon: "directions-car", label: "Vehicles",   route: "/(app)/(resident)/settings",   bg: "#5C6BC0" },
  { icon: "help-outline",   label: "Help",       route: "/(app)/(resident)/more",       bg: "#EF5350" },
];

/* ─── Visitor Approval Card ──────────────────────────────────────────── */
function VisitorApprovalCard({ item }: { item: any }) {
  const qc = useQueryClient();
  const { mutate: approve, isPending: approving } = useApproveVisitor();
  const { mutate: reject,  isPending: rejecting  } = useRejectVisitor();

  const initials = (item.visitor_name ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={s.approvalCard}>
      <View style={s.approvalAvatar}>
        <Text style={s.approvalAvatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.approvalName}>{item.visitor_name}</Text>
        <Text style={s.approvalMeta}>
          {item.visitor_type ?? "Guest"} · {formatRelative(item.created_at)}
        </Text>
      </View>
      <TouchableOpacity
        style={s.approveBtn}
        disabled={approving || rejecting}
        onPress={() =>
          approve({ id: item.id }, {
            onSuccess: () => showToast({ type: "success", message: "Visitor approved" }),
            onError:   () => showToast({ type: "error",   message: "Failed to approve" }),
          })
        }
      >
        {approving ? <ActivityIndicator size={12} color="#fff" /> : <Text style={s.approveBtnText}>Approve</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        style={s.denyBtn}
        disabled={approving || rejecting}
        onPress={() =>
          reject({ id: item.id, reason: "Denied by resident" }, {
            onSuccess: () => showToast({ type: "success", message: "Visitor denied" }),
            onError:   () => showToast({ type: "error",   message: "Failed to deny" }),
          })
        }
      >
        {rejecting ? <ActivityIndicator size={12} color={theme.colors.primary} /> : <Text style={s.denyBtnText}>Deny</Text>}
      </TouchableOpacity>
    </View>
  );
}

/* ─── Recent Activity Card ───────────────────────────────────────────── */
function ActivityCard({ item, userId }: { item: Announcement; userId: string }) {
  const qc = useQueryClient();
  const { mutate: ack } = useMutation({
    mutationFn: () => acknowledgeAnnouncement(item.id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const iconMap: Record<string, string> = {
    EMERGENCY: "warning",
    IMPORTANT: "campaign",
    NORMAL:    "notifications",
  };
  const colorMap: Record<string, string> = {
    EMERGENCY: theme.colors.danger,
    IMPORTANT: theme.colors.warning,
    NORMAL:    theme.colors.primary,
  };
  const icon  = iconMap[item.priority]  ?? "notifications";
  const color = colorMap[item.priority] ?? theme.colors.primary;

  return (
    <TouchableOpacity style={s.activityCard} onPress={() => ack()}>
      <View style={[s.activityIcon, { backgroundColor: color + "18" }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.activityTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={s.activityMeta}>{formatRelative(item.created_at)}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={theme.colors.textDisabled} />
    </TouchableOpacity>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────────── */
export default function HomeScreen() {
  const { user } = useAuthStore();

  const { data: announcements = [], isLoading: annLoading, refetch } = useQuery({
    queryKey: ["announcements"],
    queryFn: listAnnouncements,
    staleTime: 60_000,
  });

  const { data: allVisitors = [], isLoading: visLoading } = useVisitorList();
  const pendingVisitors = allVisitors.filter((v: any) => v.status === "PENDING_APPROVAL");

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name?.split(" ")[0] ?? "Resident";
  const initials  = (user?.name ?? "MN").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const refreshing = annLoading || visLoading;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor="#FFFFFF" />
        }
      >
        {/* ── Hero Header ─────────────────────────────────────────── */}
        <LinearGradient
          colors={["#0D2766", "#1565C0", "#1976D2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          {/* Top row */}
          <View style={s.heroTopRow}>
            <View style={s.heroAvatar}>
              <Text style={s.heroAvatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.heroGreeting}>{greeting()}</Text>
              <Text style={s.heroName}>{firstName}</Text>
            </View>
            <TouchableOpacity
              style={s.heroBell}
              onPress={() => router.push("/(app)/notifications" as any)}
            >
              <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
              <View style={s.heroBellDot} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={s.searchBar}>
            <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />
            <Text style={s.searchPlaceholder}>Search services, residents, notices…</Text>
          </View>

          {/* Unit Card */}
          <View style={s.unitCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.unitLabel}>Apartment</Text>
              <Text style={s.unitName}>
                {user?.communityId ? "Skyline Heights" : "My Society"} · {user?.unitId ?? "—"}
              </Text>
              <View style={s.unitVerified}>
                <MaterialIcons name="verified-user" size={13} color={theme.colors.primary} />
                <Text style={s.unitVerifiedText}>Verified</Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.payNowBtn}
              onPress={() => router.push("/(app)/(resident)/billing" as any)}
            >
              <Text style={s.payNowText}>Pay now</Text>
              <MaterialIcons name="open-in-new" size={13} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── Content Area ────────────────────────────────────────── */}
        <View style={s.content}>

          {/* Quick Actions */}
          <View style={s.sectionCard}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Quick actions</Text>
              <TouchableOpacity onPress={() => router.push("/(app)/(resident)/more" as any)}>
                <Text style={s.sectionLink}>All  ›</Text>
              </TouchableOpacity>
            </View>
            <View style={s.qaGrid}>
              {QUICK_ACTIONS.map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={s.qaItem}
                  onPress={() => router.push(a.route as any)}
                >
                  <View style={[s.qaIcon, { backgroundColor: a.bg }]}>
                    <MaterialIcons name={a.icon as any} size={22} color="#FFFFFF" />
                  </View>
                  <Text style={s.qaLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Visitor Approvals */}
          {(pendingVisitors.length > 0 || visLoading) && (
            <View style={s.sectionCard}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Visitor approvals</Text>
                <TouchableOpacity onPress={() => router.push("/(app)/(resident)/visitors" as any)}>
                  <Text style={s.sectionLink}>View all</Text>
                </TouchableOpacity>
              </View>
              {visLoading ? (
                <ActivityIndicator color={theme.colors.primary} style={{ paddingVertical: 16 }} />
              ) : (
                pendingVisitors.slice(0, 3).map((v: any) => (
                  <VisitorApprovalCard key={v.id} item={v} />
                ))
              )}
            </View>
          )}

          {/* Upcoming + New Notice row */}
          <View style={s.twoColRow}>
            <TouchableOpacity
              style={s.upcomingCard}
              onPress={() => router.push("/(app)/(resident)/bookings" as any)}
            >
              <MaterialIcons name="event-available" size={28} color="#FFFFFF" style={{ marginBottom: 8 }} />
              <Text style={s.upcomingLabel}>Upcoming</Text>
              <Text style={s.upcomingTitle}>Bookings</Text>
              <Text style={s.upcomingTime}>Tap to view</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.noticeCard}
              onPress={() => router.push("/(app)/(resident)/notices" as any)}
            >
              <MaterialIcons name="campaign" size={28} color={theme.colors.primary} style={{ marginBottom: 8 }} />
              <Text style={s.noticeLabel}>New notice</Text>
              <Text style={s.noticeTitle}>Community{"\n"}Notices</Text>
              <Text style={s.noticeTime}>Tap to view</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Activity */}
          <View style={s.sectionCard}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Recent activity</Text>
              <TouchableOpacity onPress={() => router.push("/(app)/(resident)/notices" as any)}>
                <Text style={s.sectionLink}>See more</Text>
              </TouchableOpacity>
            </View>
            {annLoading ? (
              <ActivityIndicator color={theme.colors.primary} style={{ paddingVertical: 16 }} />
            ) : announcements.length === 0 ? (
              <Text style={s.emptyText}>No recent activity</Text>
            ) : (
              announcements.slice(0, 4).map((item) => (
                <ActivityCard key={item.id} item={item} userId={user?.id ?? ""} />
              ))
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.colors.background },

  /* Hero */
  hero: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  heroTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  heroAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center", alignItems: "center",
  },
  heroAvatarText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  heroGreeting:   { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "400" },
  heroName:       { fontSize: 18, color: "#FFFFFF", fontWeight: "700" },
  heroBell: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  heroBellDot: {
    position: "absolute", top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#FFD740",
    borderWidth: 1.5, borderColor: "#1565C0",
  },

  /* Search */
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    gap: 8, marginBottom: 16,
  },
  searchPlaceholder: { fontSize: 14, color: theme.colors.textSecondary, flex: 1 },

  /* Unit Card */
  unitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center",
    ...theme.shadow.md,
  },
  unitLabel:        { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "500", marginBottom: 2 },
  unitName:         { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary },
  unitVerified:     { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  unitVerifiedText: { fontSize: 12, color: theme.colors.primary, fontWeight: "600" },
  payNowBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10,
  },
  payNowText: { fontSize: 13, fontWeight: "700", color: theme.colors.primary },

  /* Content */
  content: { padding: 16, gap: 14, paddingBottom: 32 },

  /* Section Card */
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16, padding: 16,
    ...theme.shadow.sm,
  },
  sectionRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary },
  sectionLink:  { fontSize: 13, fontWeight: "600", color: theme.colors.primary },

  /* Quick Actions */
  qaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 0 },
  qaItem: { width: "25%", alignItems: "center", paddingVertical: 8 },
  qaIcon: {
    width: 50, height: 50, borderRadius: 14,
    justifyContent: "center", alignItems: "center", marginBottom: 6,
  },
  qaLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "500", textAlign: "center" },

  /* Visitor Approval */
  approvalCard: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, gap: 10,
    borderBottomWidth: 1, borderBottomColor: theme.colors.background,
  },
  approvalAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.primaryLight + "33",
    justifyContent: "center", alignItems: "center",
  },
  approvalAvatarText: { fontSize: 14, fontWeight: "700", color: theme.colors.primary },
  approvalName:       { fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary },
  approvalMeta:       { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },
  approveBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 8, minWidth: 70, alignItems: "center",
  },
  approveBtnText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  denyBtn: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, minWidth: 52, alignItems: "center",
    borderWidth: 1, borderColor: theme.colors.border,
  },
  denyBtnText: { fontSize: 12, fontWeight: "600", color: theme.colors.textSecondary },

  /* Two-col row */
  twoColRow: { flexDirection: "row", gap: 12 },
  upcomingCard: {
    flex: 1, backgroundColor: theme.colors.primaryDark,
    borderRadius: 16, padding: 16,
    ...theme.shadow.md,
  },
  upcomingLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "500", marginBottom: 2 },
  upcomingTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  upcomingTime:  { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  noticeCard: {
    flex: 1, backgroundColor: "#E3F2FD",
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  noticeLabel: { fontSize: 11, color: theme.colors.primary, fontWeight: "600", marginBottom: 2 },
  noticeTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary },
  noticeTime:  { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4 },

  /* Activity */
  activityCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: theme.colors.background,
  },
  activityIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
  },
  activityTitle: { fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary },
  activityMeta:  { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  emptyText: { fontSize: 13, color: theme.colors.textSecondary, textAlign: "center", paddingVertical: 16 },
});
