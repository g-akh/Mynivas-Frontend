/**
 * FM Visitor Log — Phase 06
 * GET /v1/visitors | PATCH /v1/visitors/:id
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../src/components/common/AppHeader";
import StatusBadge from "../../../src/components/common/StatusBadge";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { useVisitorList, useApproveVisitor, useRejectVisitor } from "../../../src/hooks/useVisitors";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatRelative, formatDateTime } from "../../../src/utils/format";
import type { Visitor } from "../../../src/types";

type Tab = "PENDING" | "ALL";

const VISITOR_TYPE_COLOR: Record<string, string> = {
  GUEST: "#3498DB",
  COURIER: "#F39C12",
  SERVICE: "#9B59B6",
  VENDOR: "#E67E22",
};

function VisitorCard({
  item,
  showActions,
}: {
  item: Visitor;
  showActions: boolean;
}) {
  const { mutate: approve, isPending: approving } = useApproveVisitor();
  const { mutate: reject, isPending: rejecting } = useRejectVisitor();
  const isPending = approving || rejecting;
  const typeColor = VISITOR_TYPE_COLOR[item.visitor_type] ?? theme.colors.primary;

  const handleApprove = () => {
    approve(
      { id: item.id },
      { onSuccess: () => showToast({ type: "success", message: "Visitor approved" }) }
    );
  };

  const handleReject = () => {
    reject(
      { id: item.id, reason: "Rejected by FM" },
      { onSuccess: () => showToast({ type: "success", message: "Visitor rejected" }) }
    );
  };

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

      {item.entry_at ? (
        <Text style={s.entryText}>
          <MaterialIcons name="login" size={12} color={theme.colors.textSecondary} />{" "}
          Entry: {formatDateTime(item.entry_at)}
        </Text>
      ) : null}

      {showActions && (
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, s.rejectBtn]}
            onPress={handleReject}
            disabled={isPending}
          >
            <MaterialIcons name="close" size={16} color={theme.colors.danger} />
            <Text style={[s.actionText, { color: theme.colors.danger }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.approveBtn]}
            onPress={handleApprove}
            disabled={isPending}
          >
            <MaterialIcons name="check" size={16} color="#FFFFFF" />
            <Text style={[s.actionText, { color: "#FFFFFF" }]}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function FMVisitorsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("PENDING");

  const pendingQuery = useVisitorList("PENDING_APPROVAL");
  const allQuery = useVisitorList(undefined);

  const current = activeTab === "PENDING" ? pendingQuery : allQuery;
  const { data = [], isLoading, refetch } = current;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Visitors" />

      {/* Tabs */}
      <View style={s.tabRow}>
        {(["PENDING", "ALL"] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          const label = tab === "PENDING" ? "Pending Approval" : "All Visitors";
          return (
            <TouchableOpacity
              key={tab}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
              {tab === "PENDING" && (pendingQuery.data?.length ?? 0) > 0 && (
                <View style={s.tabBadge}>
                  <Text style={s.tabBadgeText}>{pendingQuery.data!.length}</Text>
                </View>
              )}
            </TouchableOpacity>
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
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <VisitorCard item={item} showActions={activeTab === "PENDING"} />
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="🚶"
              title={activeTab === "PENDING" ? "No pending approvals" : "No visitors found"}
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
  tabRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
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
    backgroundColor: theme.colors.danger,
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
    marginBottom: theme.spacing.md,
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
  visitorName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
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
  entryText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  actionRow: { flexDirection: "row", gap: 10, marginTop: theme.spacing.sm },
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
  actionText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
});
