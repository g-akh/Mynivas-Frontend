/**
 * FM — Daily Work Schedule
 * Shows today's assigned work orders sorted by priority.
 * FM can quickly see what needs to be done and update statuses inline.
 */
import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../../src/components/common/AppHeader";
import StatusBadge from "../../../../src/components/common/StatusBadge";
import EmptyState from "../../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../../src/components/common/SkeletonLoader";
import { useWorkOrderList, useUpdateWorkOrder } from "../../../../src/hooks/useWorkOrders";
import { useAuthStore } from "../../../../src/store/auth.store";
import { showToast } from "../../../../src/store/ui.store";
import { theme } from "../../../../src/theme";
import { formatRelative } from "../../../../src/utils/format";
import type { WorkOrder } from "../../../../src/types";

const PRIORITY_COLOR: Record<string, string> = { LOW: "#27AE60", MEDIUM: "#F39C12", HIGH: "#E67E22", CRITICAL: "#E74C3C" };
const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

type Filter = "ALL" | "OPEN" | "IN_PROGRESS" | "DONE";

function ScheduleCard({ item }: { item: WorkOrder }) {
  const { mutate: update, isPending } = useUpdateWorkOrder();
  const priorityColor = PRIORITY_COLOR[item.priority] ?? theme.colors.textSecondary;
  const isDone = ["COMPLETED", "CLOSED"].includes(item.status);

  const nextStatus = item.status === "OPEN" ? "IN_PROGRESS"
    : item.status === "IN_PROGRESS" ? "COMPLETED"
    : null;

  const handleProgress = () => {
    if (!nextStatus) return;
    update(
      { id: item.id, patch: { status: nextStatus as any } },
      { onSuccess: () => showToast({ type: "success", message: `Marked as ${nextStatus.replace("_", " ")}` }) }
    );
  };

  return (
    <View style={[s.card, isDone && s.cardDone]}>
      {/* Priority stripe */}
      <View style={[s.priorityBar, { backgroundColor: priorityColor }]} />

      <View style={s.cardContent}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, isDone && s.titleDone]}>{item.title}</Text>
            {item.description ? <Text style={s.desc} numberOfLines={2}>{item.description}</Text> : null}
          </View>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <View style={s.metaRow}>
          <View style={[s.priorityChip, { backgroundColor: priorityColor + "18", borderColor: priorityColor + "44" }]}>
            <Text style={[s.priorityText, { color: priorityColor }]}>{item.priority}</Text>
          </View>
          <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
        </View>

        {!isDone && nextStatus && (
          <TouchableOpacity style={[s.progressBtn, isPending && { opacity: 0.6 }]} onPress={handleProgress} disabled={isPending}>
            <MaterialIcons
              name={nextStatus === "IN_PROGRESS" ? "play-arrow" : "check-circle"}
              size={16}
              color={nextStatus === "IN_PROGRESS" ? theme.colors.primary : theme.colors.success}
            />
            <Text style={[s.progressText, { color: nextStatus === "IN_PROGRESS" ? theme.colors.primary : theme.colors.success }]}>
              {nextStatus === "IN_PROGRESS" ? "Start Work" : "Mark Complete"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function FMScheduleScreen() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data: all = [], isLoading, refetch } = useWorkOrderList(undefined);

  // Sort by priority then created_at
  const sorted = [...all].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 9;
    const pb = PRIORITY_ORDER[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const filtered = sorted.filter((w) => {
    if (filter === "ALL")         return true;
    if (filter === "OPEN")        return w.status === "OPEN";
    if (filter === "IN_PROGRESS") return w.status === "IN_PROGRESS";
    if (filter === "DONE")        return ["COMPLETED", "CLOSED"].includes(w.status);
    return true;
  });

  const counts = {
    open:  all.filter((w) => w.status === "OPEN").length,
    inProg: all.filter((w) => w.status === "IN_PROGRESS").length,
    done:  all.filter((w) => ["COMPLETED", "CLOSED"].includes(w.status)).length,
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "ALL", label: `All (${all.length})` },
    { key: "OPEN", label: `Open (${counts.open})` },
    { key: "IN_PROGRESS", label: `In Progress (${counts.inProg})` },
    { key: "DONE", label: `Done (${counts.done})` },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Schedule" />

      {/* Summary */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: theme.colors.warning }]}>{counts.open}</Text>
          <Text style={s.summaryLabel}>Open</Text>
        </View>
        <View style={s.summarySep} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: theme.colors.primary }]}>{counts.inProg}</Text>
          <Text style={s.summaryLabel}>In Progress</Text>
        </View>
        <View style={s.summarySep} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: theme.colors.success }]}>{counts.done}</Text>
          <Text style={s.summaryLabel}>Done</Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={s.filterRow}>
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <TouchableOpacity key={key} style={[s.filterChip, active && s.filterChipActive]} onPress={() => setFilter(key)}>
              <Text style={[s.filterText, active && s.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => <ScheduleCard item={item} />}
          ListEmptyComponent={
            <EmptyState emoji="📅" title="No tasks scheduled" subtitle="Work orders assigned to you appear here." />
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
  filterRow: { flexDirection: "row", gap: 8, padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  listContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.sm, flexDirection: "row", overflow: "hidden", ...theme.shadow.sm },
  cardDone: { opacity: 0.65 },
  priorityBar: { width: 4 },
  cardContent: { flex: 1, padding: theme.spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  title: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary, flex: 1, marginRight: 8 },
  titleDone: { textDecorationLine: "line-through", color: theme.colors.textSecondary },
  desc: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2, lineHeight: 16 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.sm },
  priorityChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.full, borderWidth: 1 },
  priorityText: { fontSize: 10, fontWeight: "700" },
  timeText: { fontSize: 11, color: theme.colors.textDisabled },
  progressBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, alignSelf: "flex-start" },
  progressText: { fontSize: theme.fontSize.sm, fontWeight: "600" },
});
