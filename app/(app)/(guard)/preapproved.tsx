/**
 * Guard — Pre-Approved Visitors
 * Shows active visitor passes created by residents so guard can check them in directly.
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../src/components/common/AppHeader";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { useVisitorPassList } from "../../../src/hooks/useVisitors";
import { theme } from "../../../src/theme";
import { formatDateTime, formatRelative } from "../../../src/utils/format";
import type { VisitorPass } from "../../../src/types";

function PassCard({ item }: { item: VisitorPass }) {
  const now       = new Date();
  const expiresAt = new Date(item.expires_at);
  const isExpired = expiresAt < now;
  const isActive  = !isExpired && item.status === "ACTIVE";

  const statusColor = isExpired
    ? theme.colors.textDisabled
    : isActive
    ? theme.colors.success
    : theme.colors.warning;

  const statusLabel = isExpired ? "Expired" : item.status;

  return (
    <View style={[s.card, isExpired && s.cardExpired]}>
      <View style={s.cardHeader}>
        <View style={s.nameRow}>
          <View style={[s.avatar, { backgroundColor: statusColor + "20" }]}>
            <MaterialIcons name="verified-user" size={20} color={statusColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.visitorName}>{item.visitor_name}</Text>
            <Text style={s.passId}>Pass #{item.id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>
        <View style={[s.statusChip, { backgroundColor: statusColor + "15", borderColor: statusColor + "44" }]}>
          <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={s.timeRow}>
        <MaterialIcons name="event" size={12} color={theme.colors.textSecondary} />
        <Text style={s.timeText}>Expected: {formatDateTime(item.expected_at)}</Text>
      </View>
      <View style={s.timeRow}>
        <MaterialIcons name="timer-off" size={12} color={isExpired ? theme.colors.danger : theme.colors.textSecondary} />
        <Text style={[s.timeText, isExpired && { color: theme.colors.danger }]}>
          Expires: {formatDateTime(item.expires_at)}
        </Text>
      </View>

      <View style={s.footer}>
        <Text style={s.createdText}>Created {formatRelative(item.created_at)}</Text>
        {isActive && (
          <View style={s.activeIndicator}>
            <View style={s.activeDot} />
            <Text style={s.activeText}>Valid — allow entry</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function PreApprovedScreen() {
  const { data: passes = [], isLoading, refetch } = useVisitorPassList();

  // Sort: active first, then by expected_at
  const sorted = [...passes].sort((a, b) => {
    const aActive = new Date(a.expires_at) > new Date() && a.status === "ACTIVE";
    const bActive = new Date(b.expires_at) > new Date() && b.status === "ACTIVE";
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return new Date(b.expected_at).getTime() - new Date(a.expected_at).getTime();
  });

  const activeCount = passes.filter(
    (p) => new Date(p.expires_at) > new Date() && p.status === "ACTIVE"
  ).length;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Pre-Approved" />

      {/* Summary bar */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: theme.colors.success }]}>{activeCount}</Text>
          <Text style={s.summaryLabel}>Active Passes</Text>
        </View>
        <View style={s.summarySep} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: theme.colors.textPrimary }]}>{passes.length}</Text>
          <Text style={s.summaryLabel}>Total Passes</Text>
        </View>
      </View>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.colors.primary} />
          }
          renderItem={({ item }) => <PassCard item={item} />}
          ListEmptyComponent={
            <EmptyState
              emoji="🎫"
              title="No pre-approved visitors"
              subtitle="Residents create passes for their expected guests."
            />
          }
          contentContainerStyle={s.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  summaryBar: { flexDirection: "row", backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: 12 },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  summaryNum: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold },
  summaryLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  summarySep: { width: 1, backgroundColor: theme.colors.border },
  listContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.shadow.sm },
  cardExpired: { opacity: 0.55 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spacing.sm },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
  visitorName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  passId: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  statusChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: theme.borderRadius.full, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: theme.fontWeight.semibold },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  timeText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  createdText: { fontSize: 11, color: theme.colors.textDisabled },
  activeIndicator: { flexDirection: "row", alignItems: "center", gap: 5 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.success },
  activeText: { fontSize: 11, color: theme.colors.success, fontWeight: "600" },
});
