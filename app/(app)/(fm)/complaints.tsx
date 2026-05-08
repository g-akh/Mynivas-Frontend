/**
 * FM Complaints Screen — Phase 05
 * GET /v1/complaints (with status/priority filter)
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
import { useComplaintList } from "../../../src/hooks/useComplaints";
import { useAuthStore } from "../../../src/store/auth.store";
import { theme } from "../../../src/theme";
import { formatRelative, formatDate } from "../../../src/utils/format";
import type { ComplaintStatus, Complaint } from "../../../src/types";

const STATUS_FILTERS: { label: string; value: ComplaintStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "New", value: "NEW" },
  { label: "Assigned", value: "ASSIGNED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

const PRIORITY_COLOR: Record<string, string> = {
  LOW: theme.colors.success,
  MEDIUM: theme.colors.warning,
  HIGH: "#E67E22",
  CRITICAL: theme.colors.danger,
};

function SlaIndicator({ slaDueAt }: { slaDueAt: string | null }) {
  if (!slaDueAt) return null;
  const now = Date.now();
  const due = new Date(slaDueAt).getTime();
  const diff = due - now;
  const isBreaching = diff < 0;
  const isWarning = diff < 2 * 60 * 60 * 1000; // < 2h

  const color = isBreaching
    ? theme.colors.danger
    : isWarning
    ? theme.colors.warning
    : theme.colors.success;

  return (
    <View style={[s.slaChip, { borderColor: color + "55", backgroundColor: color + "15" }]}>
      <MaterialIcons
        name={isBreaching ? "warning" : "schedule"}
        size={11}
        color={color}
      />
      <Text style={[s.slaText, { color }]}>
        {isBreaching ? "SLA Breached" : `SLA: ${formatDate(slaDueAt)}`}
      </Text>
    </View>
  );
}

function ComplaintCard({ item }: { item: Complaint }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.cardHeaderLeft}>
          <View
            style={[
              s.priorityDot,
              { backgroundColor: PRIORITY_COLOR[item.priority] ?? theme.colors.textSecondary },
            ]}
          />
          <Text style={s.category}>{item.category}</Text>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>
      <Text style={s.description} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={s.cardMeta}>
        <StatusBadge status={item.priority} size="sm" />
        {item.assigned_to ? (
          <View style={s.assignedRow}>
            <MaterialIcons name="person" size={13} color={theme.colors.textSecondary} />
            <Text style={s.assignedText} numberOfLines={1}>
              {item.assigned_to}
            </Text>
          </View>
        ) : (
          <Text style={s.unassigned}>Unassigned</Text>
        )}
      </View>
      <View style={s.cardFooter}>
        <SlaIndicator slaDueAt={item.sla_due_at} />
        <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
      </View>
    </View>
  );
}

export default function FMComplaintsScreen() {
  const { user } = useAuthStore();
  const [activeStatus, setActiveStatus] = useState<ComplaintStatus | undefined>(undefined);
  // FM sees only complaints assigned to them — backend also enforces this server-side
  const { data = [], isLoading, refetch } = useComplaintList(activeStatus, user?.id);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Complaints" />

      {/* Status filter chips */}
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
          renderItem={({ item }) => <ComplaintCard item={item} />}
          ListEmptyComponent={
            <EmptyState
              emoji="📋"
              title="No assigned complaints"
              subtitle="Complaints assigned to you will appear here."
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
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
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
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  category: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  assignedRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  assignedText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    maxWidth: 140,
  },
  unassigned: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.danger,
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  slaText: { fontSize: 10, fontWeight: theme.fontWeight.semibold },
  timeText: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled },
});
