/**
 * Technician Tasks — Phase 16
 * GET /v1/work-orders (assigned to me)
 * PATCH /v1/work-orders/:id {status}
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
import { useWorkOrderList, useUpdateWorkOrder } from "../../../src/hooks/useWorkOrders";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatRelative } from "../../../src/utils/format";
import type { WorkOrderStatus, WorkOrder } from "../../../src/types";

const STATUS_FILTERS: { label: string; value: WorkOrderStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Open", value: "OPEN" },
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

function TaskCard({ item }: { item: WorkOrder }) {
  const { mutate: updateWO, isPending } = useUpdateWorkOrder();
  const typeColor = TYPE_COLOR[item.type] ?? theme.colors.primary;
  const priorityColor = PRIORITY_COLOR[item.priority] ?? theme.colors.textSecondary;

  const handleUpdate = (status: WorkOrderStatus) => {
    updateWO(
      { id: item.id, patch: { status } },
      {
        onSuccess: () => showToast({ type: "success", message: `Marked as ${status.replace("_", " ")}` }),
        onError: () => showToast({ type: "error", message: "Failed to update" }),
      }
    );
  };

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View
          style={[
            s.typeBadge,
            { backgroundColor: typeColor + "15", borderColor: typeColor + "44" },
          ]}
        >
          <Text style={[s.typeText, { color: typeColor }]}>{item.type}</Text>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>

      <View style={s.priorityRow}>
        <View style={[s.priorityDot, { backgroundColor: priorityColor }]} />
        <Text style={[s.priorityLabel, { color: priorityColor }]}>
          {item.priority} PRIORITY
        </Text>
        <Text style={s.idText}>#{item.id.slice(-8).toUpperCase()}</Text>
      </View>

      <View style={s.cardFooter}>
        <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
      </View>

      {/* Action buttons based on current status */}
      <View style={s.actionRow}>
        {item.status === "OPEN" || item.status === "ASSIGNED" ? (
          <TouchableOpacity
            style={[s.actionBtn, s.inProgressBtn]}
            onPress={() => handleUpdate("IN_PROGRESS")}
            disabled={isPending}
          >
            <MaterialIcons name="play-arrow" size={15} color={theme.colors.primary} />
            <Text style={[s.actionBtnText, { color: theme.colors.primary }]}>Start</Text>
          </TouchableOpacity>
        ) : null}

        {item.status === "IN_PROGRESS" ? (
          <>
            <TouchableOpacity
              style={[s.actionBtn, s.blockedBtn]}
              onPress={() => handleUpdate("BLOCKED")}
              disabled={isPending}
            >
              <MaterialIcons name="block" size={15} color={theme.colors.warning} />
              <Text style={[s.actionBtnText, { color: theme.colors.warning }]}>Blocked</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, s.completedBtn]}
              onPress={() => handleUpdate("COMPLETED")}
              disabled={isPending}
            >
              <MaterialIcons name="check-circle" size={15} color="#FFFFFF" />
              <Text style={[s.actionBtnText, { color: "#FFFFFF" }]}>Complete</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {item.status === "BLOCKED" ? (
          <TouchableOpacity
            style={[s.actionBtn, s.inProgressBtn]}
            onPress={() => handleUpdate("IN_PROGRESS")}
            disabled={isPending}
          >
            <MaterialIcons name="play-arrow" size={15} color={theme.colors.primary} />
            <Text style={[s.actionBtnText, { color: theme.colors.primary }]}>Resume</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function TechnicianTasksScreen() {
  const [activeStatus, setActiveStatus] = useState<WorkOrderStatus | undefined>(undefined);
  const { data = [], isLoading, refetch } = useWorkOrderList(activeStatus);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="My Tasks" />

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
          renderItem={({ item }) => <TaskCard item={item} />}
          ListEmptyComponent={
            <EmptyState
              emoji="🔧"
              title="No tasks assigned"
              subtitle="You have no work orders assigned to you right now."
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
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, flex: 1 },
  idText: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled, fontFamily: "monospace" },
  cardFooter: { marginBottom: theme.spacing.sm },
  timeText: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  inProgressBtn: {
    backgroundColor: theme.colors.primary + "15",
    borderWidth: 1,
    borderColor: theme.colors.primary + "55",
  },
  blockedBtn: {
    backgroundColor: theme.colors.warning + "15",
    borderWidth: 1,
    borderColor: theme.colors.warning + "55",
  },
  completedBtn: { backgroundColor: theme.colors.success },
  actionBtnText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
});
