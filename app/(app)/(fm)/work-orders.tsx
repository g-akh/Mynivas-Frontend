/**
 * FM Work Orders — Phase 07
 * GET /v1/work-orders
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
import { useWorkOrderList } from "../../../src/hooks/useWorkOrders";
import { theme } from "../../../src/theme";
import { formatRelative } from "../../../src/utils/format";
import type { WorkOrderStatus, WorkOrder } from "../../../src/types";

const STATUS_FILTERS: { label: string; value: WorkOrderStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Open", value: "OPEN" },
  { label: "Assigned", value: "ASSIGNED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Blocked", value: "BLOCKED" },
  { label: "Completed", value: "COMPLETED" },
];

const TYPE_COLOR: Record<string, string> = {
  PPM: "#9B59B6",
  COMPLAINT: "#E74C3C",
  REACTIVE: "#F39C12",
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: theme.colors.success,
  MEDIUM: theme.colors.warning,
  HIGH: theme.colors.danger,
};

function WorkOrderCard({ item }: { item: WorkOrder }) {
  const typeColor = TYPE_COLOR[item.type] ?? theme.colors.primary;
  const priorityColor = PRIORITY_COLOR[item.priority] ?? theme.colors.textSecondary;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.typeBadge, { backgroundColor: typeColor + "15", borderColor: typeColor + "44" }]}>
          <Text style={[s.typeText, { color: typeColor }]}>{item.type}</Text>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>

      <View style={s.metaRow}>
        <View style={s.priorityRow}>
          <View style={[s.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={[s.priorityLabel, { color: priorityColor }]}>{item.priority}</Text>
        </View>
        {item.assigned_to ? (
          <View style={s.assignedRow}>
            <MaterialIcons name="person" size={13} color={theme.colors.textSecondary} />
            <Text style={s.assignedText} numberOfLines={1}>{item.assigned_to}</Text>
          </View>
        ) : (
          <Text style={s.unassigned}>Unassigned</Text>
        )}
      </View>

      <View style={s.cardFooter}>
        <Text style={s.idText}>#{item.id.slice(-8).toUpperCase()}</Text>
        <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
      </View>
    </View>
  );
}

export default function FMWorkOrdersScreen() {
  const [activeStatus, setActiveStatus] = useState<WorkOrderStatus | undefined>(undefined);
  const { data = [], isLoading, refetch } = useWorkOrderList(activeStatus);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Work Orders" />

      <View style={s.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(f) => f.label}
          renderItem={({ item: f }) => {
            const active = activeStatus === f.value;
            return (
              <TouchableOpacity
                style={[s.chip, active && s.chipActive]}
                onPress={() => setActiveStatus(f.value)}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: theme.spacing.md }}
        />
      </View>

      {isLoading ? (
        <SkeletonList count={5} />
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
          renderItem={({ item }) => <WorkOrderCard item={item} />}
          ListEmptyComponent={
            <EmptyState
              emoji="🔧"
              title="No work orders"
              subtitle="No work orders match the selected filter."
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
  filterRow: { paddingVertical: theme.spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.textSecondary },
  chipTextActive: { color: "#FFFFFF" },
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
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  typeText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, letterSpacing: 0.5 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  priorityRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
  assignedRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  assignedText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, maxWidth: 140 },
  unassigned: { fontSize: theme.fontSize.xs, color: theme.colors.danger, fontStyle: "italic" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  idText: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled, fontFamily: "monospace" },
  timeText: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled },
});
