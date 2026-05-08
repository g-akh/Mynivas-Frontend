/**
 * FM Visitor Overview — read-only operational view.
 * Approve/Reject belongs to Residents (their own visitors) and Guards (at the gate).
 * FM sees: who is Inside Now, full visitor log, live counts.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../src/components/common/AppHeader";
import StatusBadge from "../../../src/components/common/StatusBadge";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { useVisitorList } from "../../../src/hooks/useVisitors";
import { theme } from "../../../src/theme";
import { formatRelative, formatDateTime } from "../../../src/utils/format";
import type { Visitor } from "../../../src/types";

type Tab = "INSIDE" | "ALL";

const VISITOR_TYPE_COLOR: Record<string, string> = {
  GUEST: "#3498DB",
  COURIER: "#F39C12",
  SERVICE: "#9B59B6",
  VENDOR: "#E67E22",
  DELIVERY: "#E67E22",
};

function VisitorCard({ item }: { item: Visitor }) {
  const typeColor = VISITOR_TYPE_COLOR[item.visitor_type] ?? theme.colors.primary;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.nameRow}>
          <View style={[s.typeCircle, { backgroundColor: typeColor + "20", borderColor: typeColor + "55" }]}>
            <MaterialIcons name="person" size={18} color={typeColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.visitorName}>{item.visitor_name}</Text>
            {item.visitor_phone ? (
              <Text style={s.visitorPhone}>{item.visitor_phone}</Text>
            ) : null}
          </View>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>

      <View style={s.metaRow}>
        <View style={[s.typeChip, { backgroundColor: typeColor + "15", borderColor: typeColor + "40" }]}>
          <Text style={[s.typeText, { color: typeColor }]}>{item.visitor_type}</Text>
        </View>
        <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
      </View>

      {/* Entry / Exit times for operational tracking */}
      {item.entry_at ? (
        <View style={s.timeRow}>
          <MaterialIcons name="login" size={12} color={theme.colors.success} />
          <Text style={s.entryText}>In: {formatDateTime(item.entry_at)}</Text>
          {item.exit_at ? (
            <>
              <MaterialIcons name="logout" size={12} color={theme.colors.danger} style={{ marginLeft: 10 }} />
              <Text style={s.exitText}>Out: {formatDateTime(item.exit_at)}</Text>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function FMVisitorsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("INSIDE");

  const insideQuery = useVisitorList("CHECKED_IN");
  const allQuery    = useVisitorList(undefined);
  const pendingQuery = useVisitorList("PENDING_APPROVAL");

  const current = activeTab === "INSIDE" ? insideQuery : allQuery;
  const { data = [], isLoading, refetch } = current;

  const insideCount  = insideQuery.data?.length ?? 0;
  const pendingCount = pendingQuery.data?.length ?? 0;
  const totalCount   = allQuery.data?.length ?? 0;

  const handleRefresh = () => {
    insideQuery.refetch();
    allQuery.refetch();
    pendingQuery.refetch();
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Visitors" />

      {/* Live counts bar */}
      <View style={s.countsBar}>
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: theme.colors.success }]}>{insideCount}</Text>
          <Text style={s.countLabel}>Inside</Text>
        </View>
        <View style={s.countSep} />
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: theme.colors.warning }]}>{pendingCount}</Text>
          <Text style={s.countLabel}>Pending</Text>
        </View>
        <View style={s.countSep} />
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: theme.colors.textPrimary }]}>{totalCount}</Text>
          <Text style={s.countLabel}>Total Today</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {([
          { key: "INSIDE" as Tab, label: "Inside Now", count: insideCount },
          { key: "ALL"    as Tab, label: "All Visitors", count: 0 },
        ]).map(({ key, label, count }) => {
          const active = activeTab === key;
          return (
            <View
              key={key}
              style={[s.tab, active && s.tabActive]}
              onTouchEnd={() => setActiveTab(key)}
            >
              <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
              {count > 0 && (
                <View style={s.tabBadge}>
                  <Text style={s.tabBadgeText}>{count}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => <VisitorCard item={item} />}
          ListEmptyComponent={
            <EmptyState
              emoji={activeTab === "INSIDE" ? "🚪" : "🚶"}
              title={activeTab === "INSIDE" ? "Nobody inside right now" : "No visitors found"}
              subtitle={activeTab === "INSIDE" ? "Checked-in visitors will appear here" : "Visitor activity will appear here"}
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

  countsBar: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 12,
  },
  countItem: { flex: 1, alignItems: "center", gap: 2 },
  countNum: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold },
  countLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  countSep: { width: 1, backgroundColor: theme.colors.border },

  tabRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: theme.colors.primary },
  tabText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.success,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, color: "#FFFFFF", fontWeight: theme.fontWeight.bold },

  listContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  typeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  visitorName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  visitorPhone: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.xs },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  typeText: { fontSize: 10, fontWeight: theme.fontWeight.semibold },
  timeText: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  entryText: { fontSize: theme.fontSize.xs, color: theme.colors.success },
  exitText:  { fontSize: theme.fontSize.xs, color: theme.colors.danger },
});
