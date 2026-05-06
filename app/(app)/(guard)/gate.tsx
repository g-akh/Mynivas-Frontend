/**
 * Guard Gate Dashboard — Phase 13
 * GET /v1/visitors (auto-refresh 30s)
 * PATCH /v1/visitors/:id
 */
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SectionList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import AppHeader from "../../../src/components/common/AppHeader";
import StatusBadge from "../../../src/components/common/StatusBadge";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { useVisitorList, useApproveVisitor, useRejectVisitor, useCheckoutVisitor } from "../../../src/hooks/useVisitors";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatRelative } from "../../../src/utils/format";
import type { Visitor } from "../../../src/types";

const VISITOR_TYPE_COLOR: Record<string, string> = {
  GUEST: "#3498DB",
  COURIER: "#F39C12",
  SERVICE: "#9B59B6",
  VENDOR: "#E67E22",
};

function VisitorGateCard({
  item,
  section,
}: {
  item: Visitor;
  section: "pending" | "checked_in";
}) {
  const { mutate: approve, isPending: approving } = useApproveVisitor();
  const { mutate: reject, isPending: rejecting } = useRejectVisitor();
  const { mutate: checkout, isPending: checkingOut } = useCheckoutVisitor();
  const isPending = approving || rejecting || checkingOut;
  const typeColor = VISITOR_TYPE_COLOR[item.visitor_type] ?? theme.colors.primary;

  const handleApprove = () => {
    approve(
      { id: item.id },
      { onSuccess: () => showToast({ type: "success", message: "Visitor approved" }) }
    );
  };

  const handleReject = () => {
    reject(
      { id: item.id, reason: "Rejected by guard" },
      { onSuccess: () => showToast({ type: "success", message: "Visitor rejected" }) }
    );
  };

  const handleCheckOut = () => {
    checkout(
      { id: item.id },
      { onSuccess: () => showToast({ type: "success", message: "Visitor checked out" }) }
    );
  };

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.nameRow}>
          <View
            style={[
              s.typeCircle,
              { backgroundColor: typeColor + "20", borderColor: typeColor + "55" },
            ]}
          >
            <MaterialIcons name="person" size={18} color={typeColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.visitorName}>{item.visitor_name}</Text>
            {item.visitor_phone ? (
              <Text style={s.visitorPhone}>{item.visitor_phone}</Text>
            ) : null}
          </View>
        </View>
        <View style={s.headerRight}>
          <View
            style={[
              s.typeChip,
              { backgroundColor: typeColor + "15", borderColor: typeColor + "40" },
            ]}
          >
            <Text style={[s.typeText, { color: typeColor }]}>{item.visitor_type}</Text>
          </View>
          <StatusBadge status={item.status} size="sm" />
        </View>
      </View>

      <View style={s.metaRow}>
        <MaterialIcons name="access-time" size={12} color={theme.colors.textSecondary} />
        <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
      </View>

      {section === "pending" && (
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, s.rejectBtn]}
            onPress={handleReject}
            disabled={isPending}
          >
            <MaterialIcons name="close" size={16} color={theme.colors.danger} />
            <Text style={[s.actionBtnText, { color: theme.colors.danger }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.approveBtn]}
            onPress={handleApprove}
            disabled={isPending}
          >
            <MaterialIcons name="check" size={16} color="#FFFFFF" />
            <Text style={[s.actionBtnText, { color: "#FFFFFF" }]}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}

      {section === "checked_in" && (
        <TouchableOpacity
          style={[s.actionBtn, s.checkOutBtn]}
          onPress={handleCheckOut}
          disabled={isPending}
        >
          <MaterialIcons name="logout" size={16} color={theme.colors.primary} />
          <Text style={[s.actionBtnText, { color: theme.colors.primary }]}>Check Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function GuardGateScreen() {
  const qc = useQueryClient();
  const pendingQuery = useVisitorList("PENDING_APPROVAL");
  const checkedInQuery = useVisitorList("CHECKED_IN");

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["visitors"] });
    }, 30_000);
    return () => clearInterval(interval);
  }, [qc]);

  const isLoading = pendingQuery.isLoading || checkedInQuery.isLoading;
  const pendingVisitors = pendingQuery.data ?? [];
  const checkedInVisitors = checkedInQuery.data ?? [];

  const sections = [
    { title: "Pending Approval", key: "pending" as const, data: pendingVisitors },
    { title: "Checked In", key: "checked_in" as const, data: checkedInVisitors },
  ].filter((s) => s.data.length > 0 || s.key === "pending");

  const handleRefresh = () => {
    pendingQuery.refetch();
    checkedInQuery.refetch();
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader
        title="Gate"
        rightAction={{
          icon: "refresh",
          onPress: handleRefresh,
          testID: "gate-refresh",
        }}
      />

      {/* Counts bar */}
      <View style={s.countsBar}>
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: theme.colors.warning }]}>
            {pendingVisitors.length}
          </Text>
          <Text style={s.countLabel}>Pending</Text>
        </View>
        <View style={s.countSep} />
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: theme.colors.success }]}>
            {checkedInVisitors.length}
          </Text>
          <Text style={s.countLabel}>Inside</Text>
        </View>
        <View style={s.countSep} />
        <View style={s.countItem}>
          <MaterialIcons name="autorenew" size={14} color={theme.colors.textDisabled} />
          <Text style={s.countLabel}>30s refresh</Text>
        </View>
      </View>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                {section.title} ({section.data.length})
              </Text>
              {section.key === "pending" && section.data.length > 0 && (
                <View style={s.sectionBadge}>
                  <Text style={s.sectionBadgeText}>{section.data.length}</Text>
                </View>
              )}
            </View>
          )}
          renderItem={({ item, section }) => (
            <VisitorGateCard item={item} section={section.key} />
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="🚪"
              title="No visitors"
              subtitle="No pending or checked-in visitors right now."
            />
          }
          contentContainerStyle={s.listContent}
          stickySectionHeadersEnabled={false}
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
  listContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  sectionBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.danger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  sectionBadgeText: { fontSize: 11, color: "#FFFFFF", fontWeight: theme.fontWeight.bold },
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
  headerRight: { alignItems: "flex-end", gap: 4 },
  typeChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  typeText: { fontSize: 10, fontWeight: theme.fontWeight.semibold },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: theme.spacing.sm },
  timeText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    height: 38,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  rejectBtn: {
    backgroundColor: theme.colors.danger + "15",
    borderWidth: 1,
    borderColor: theme.colors.danger + "55",
  },
  approveBtn: { backgroundColor: theme.colors.success },
  checkOutBtn: {
    backgroundColor: theme.colors.primary + "15",
    borderWidth: 1,
    borderColor: theme.colors.primary + "55",
  },
  actionBtnText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
});
