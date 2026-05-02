/**
 * FM Dashboard — Phase 04
 * GET /v1/reports/dashboard?community_id=
 * Polls every 60 seconds
 */
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../../src/components/common/AppHeader";
import KpiCard from "../../../src/components/common/KpiCard";
import { getDashboard } from "../../../src/api/reports";
import { useAuthStore } from "../../../src/store/auth.store";
import { theme } from "../../../src/theme";
import { formatRelative } from "../../../src/utils/format";

const POLL_INTERVAL = 60_000;

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["dashboard", user?.communityId],
    queryFn: () => getDashboard(user!.communityId),
    enabled: !!user?.communityId,
    refetchInterval: POLL_INTERVAL,
    staleTime: 30_000,
  });

  const lastUpdated = dataUpdatedAt
    ? formatRelative(new Date(dataUpdatedAt).toISOString()) : "";

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <AppHeader title="Dashboard" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <AppHeader title="Dashboard" />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader title="FM Dashboard" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <View style={styles.updatedRow}>
          <Text style={styles.updatedText}>Updated {lastUpdated}</Text>
        </View>

        <Text style={styles.sectionTitle}>Complaints</Text>
        <View style={styles.kpiRow}>
          <KpiCard label="Open" value={data.complaints.open_count} icon="report-problem" color={theme.colors.warning} urgent={data.complaints.open_count > 5} onPress={() => router.push("/(app)/(fm)/complaints" as any)} testID="kpi-open-complaints" />
          <KpiCard label="Breaching SLA" value={data.complaints.breaching_sla_count} icon="alarm" color={theme.colors.danger} urgent={data.complaints.breaching_sla_count > 0} testID="kpi-breaching-sla" />
        </View>

        <Text style={styles.sectionTitle}>Visitors</Text>
        <View style={styles.kpiRow}>
          <KpiCard label="Pending Approval" value={data.visitors.pending_approval_count} icon="how-to-reg" color={theme.colors.warning} urgent={data.visitors.pending_approval_count > 0} onPress={() => router.push("/(app)/(fm)/visitors" as any)} testID="kpi-pending-visitors" />
          <KpiCard label="Checked In" value={data.visitors.currently_checked_in_count} icon="meeting-room" color={theme.colors.info} testID="kpi-checked-in" />
        </View>

        <Text style={styles.sectionTitle}>Work Orders</Text>
        <View style={styles.kpiRow}>
          <KpiCard label="Unassigned" value={data.work_orders.unassigned_count} icon="assignment-ind" color={theme.colors.warning} urgent={data.work_orders.unassigned_count > 3} testID="kpi-unassigned-wo" />
          <KpiCard label="Blocked" value={data.work_orders.blocked_count} icon="block" color={theme.colors.danger} urgent={data.work_orders.blocked_count > 0} testID="kpi-blocked-wo" />
        </View>

        <Text style={styles.sectionTitle}>Other</Text>
        <View style={styles.kpiRow}>
          <KpiCard label="PPM Overdue" value={data.ppm.overdue_count} icon="event-busy" color={theme.colors.danger} urgent={data.ppm.overdue_count > 0} testID="kpi-ppm-overdue" />
          <KpiCard label="Pending ACK" value={data.announcements.pending_ack_count} icon="campaign" color={theme.colors.secondary} testID="kpi-pending-ack" />
        </View>
        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: theme.spacing.xl },
  loadingText: { marginTop: theme.spacing.md, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  errorEmoji: { fontSize: 48, marginBottom: theme.spacing.md },
  errorTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  updatedRow: { alignItems: "flex-end", marginBottom: theme.spacing.sm },
  updatedText: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled },
  sectionTitle: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  kpiRow: { flexDirection: "row", gap: theme.spacing.md, marginBottom: theme.spacing.xs },
});
