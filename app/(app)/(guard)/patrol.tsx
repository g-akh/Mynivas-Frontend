/**
 * Guard — Patrol Log (persisted via community-service API)
 * Guards log their patrol checkpoints; admin/FM can view all logs.
 */
import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "../../../src/components/common/AppHeader";
import LoadingButton from "../../../src/components/common/LoadingButton";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { listPatrolLogs, createPatrolLog, PatrolLog } from "../../../src/api/community";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { guardTheme as g } from "../../../src/theme/guardTheme";
import { formatRelative } from "../../../src/utils/format";

const STATUS_OPTIONS = [
  { key: "OK",       label: "All Clear",  icon: "check-circle",   color: g.colors.success },
  { key: "ALERT",    label: "Alert",      icon: "warning",         color: "#F39C12" },
  { key: "INCIDENT", label: "Incident",   icon: "report-problem",  color: "#E74C3C" },
];

const LOCATIONS = [
  "Main Gate", "Rear Gate", "Parking Area", "Clubhouse",
  "Swimming Pool", "Garden", "Basement", "Lift Lobby", "Other",
];

function PatrolCard({ item }: { item: PatrolLog }) {
  const statusOpt = STATUS_OPTIONS.find((s) => s.key === item.status) ?? STATUS_OPTIONS[0];
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.statusIcon, { backgroundColor: statusOpt.color + "20" }]}>
          <MaterialIcons name={statusOpt.icon as any} size={18} color={statusOpt.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.location}>{item.location}</Text>
          <Text style={s.guardName}>{item.guard_name}</Text>
        </View>
        <View style={[s.statusChip, { backgroundColor: statusOpt.color + "15", borderColor: statusOpt.color + "44" }]}>
          <Text style={[s.statusText, { color: statusOpt.color }]}>{statusOpt.label}</Text>
        </View>
      </View>
      {item.notes ? <Text style={s.notes}>{item.notes}</Text> : null}
      <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
    </View>
  );
}

function LogPatrolModal({ visible, communityId, guardName, onClose }: {
  visible: boolean; communityId: string; guardName: string; onClose: () => void;
}) {
  const qc = useQueryClient();
  const [location, setLocation] = useState("Main Gate");
  const [customLoc, setCustomLoc] = useState("");
  const [status, setStatus]     = useState("OK");
  const [notes, setNotes]       = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => createPatrolLog(communityId, {
      guardName,
      location: location === "Other" ? customLoc.trim() || "Other" : location,
      status,
      notes: notes.trim(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patrol", communityId] });
      showToast({ type: "success", message: "Patrol log saved" });
      setNotes(""); setLocation("Main Gate"); setStatus("OK"); setCustomLoc("");
      onClose();
    },
    onError: () => showToast({ type: "error", message: "Failed to save" }),
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>Log Patrol</Text>

          <Text style={s.fieldLabel}>Location</Text>
          <FlatList horizontal showsHorizontalScrollIndicator={false}
            data={LOCATIONS} keyExtractor={(l) => l}
            renderItem={({ item: l }) => (
              <TouchableOpacity style={[s.chip, location === l && s.chipActive]} onPress={() => setLocation(l)}>
                <Text style={[s.chipText, location === l && s.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          />
          {location === "Other" && (
            <TextInput style={s.input} value={customLoc} onChangeText={setCustomLoc} placeholder="Enter location" placeholderTextColor={g.colors.textDisabled} />
          )}

          <Text style={s.fieldLabel}>Status</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[s.statusBtn, status === opt.key && { backgroundColor: opt.color, borderColor: opt.color }]}
                onPress={() => setStatus(opt.key)}
              >
                <MaterialIcons name={opt.icon as any} size={14} color={status === opt.key ? "#fff" : opt.color} />
                <Text style={[s.statusBtnText, { color: status === opt.key ? "#fff" : opt.color }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={[s.input, { height: 80 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Observations, issues, anything to flag…"
            multiline
            placeholderTextColor={g.colors.textDisabled}
          />

          <LoadingButton title="Save Patrol Log" loadingTitle="Saving…" onPress={() => mutate()} isLoading={isPending} style={{ marginTop: g.spacing.lg }} />
          <TouchableOpacity style={s.cancelRow} onPress={onClose}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function PatrolScreen() {
  const { user } = useAuthStore();
  const communityId = user?.communityId ?? "";
  const [showLog, setShowLog] = useState(false);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["patrol", communityId],
    queryFn: () => listPatrolLogs(communityId),
    enabled: !!communityId,
    staleTime: 30_000,
  });

  const todayLogs = logs.filter((l) => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  });

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Patrol Log" gradientColors={["#49225B", "#6E3482", "#7B3F9A"]} />

      <View style={s.countsBar}>
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: g.colors.primary }]}>{todayLogs.length}</Text>
          <Text style={s.countLabel}>Today</Text>
        </View>
        <View style={s.countSep} />
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: "#E74C3C" }]}>{logs.filter((l) => l.status === "INCIDENT").length}</Text>
          <Text style={s.countLabel}>Incidents</Text>
        </View>
        <View style={s.countSep} />
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: g.colors.textPrimary }]}>{logs.length}</Text>
          <Text style={s.countLabel}>Total</Text>
        </View>
      </View>

      {isLoading ? <SkeletonList count={4} /> : (
        <FlatList
          data={logs} keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={g.colors.primary} />}
          renderItem={({ item }) => <PatrolCard item={item} />}
          ListEmptyComponent={<EmptyState emoji="🚶" title="No patrol logs yet" subtitle="Tap + to log your first patrol." />}
          contentContainerStyle={s.listContent}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => setShowLog(true)}>
        <MaterialIcons name="add-location-alt" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <LogPatrolModal
        visible={showLog}
        communityId={communityId}
        guardName={user?.name ?? "Guard"}
        onClose={() => setShowLog(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: g.colors.background },
  countsBar: { flexDirection: "row", backgroundColor: g.colors.surface, borderBottomWidth: 1, borderBottomColor: g.colors.border, paddingVertical: 12 },
  countItem: { flex: 1, alignItems: "center", gap: 2 },
  countNum: { fontSize: g.fontSize.xl, fontWeight: g.fontWeight.bold },
  countLabel: { fontSize: g.fontSize.xs, color: g.colors.textSecondary },
  countSep: { width: 1, backgroundColor: g.colors.border },
  listContent: { padding: g.spacing.md, paddingBottom: 90 },
  card: { backgroundColor: g.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: g.colors.border, padding: g.spacing.md, marginBottom: g.spacing.sm, ...g.shadow.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  statusIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  location: { fontSize: g.fontSize.md, fontWeight: g.fontWeight.semibold, color: g.colors.textPrimary },
  guardName: { fontSize: g.fontSize.xs, color: g.colors.textSecondary },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: g.borderRadius.full, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: "700" },
  notes: { fontSize: g.fontSize.xs, color: g.colors.textSecondary, marginBottom: 4 },
  timeText: { fontSize: 11, color: g.colors.textDisabled },
  fab: { position: "absolute", bottom: 28, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: g.colors.primary, justifyContent: "center", alignItems: "center", ...g.shadow.lg },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: g.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: g.spacing.xl, maxHeight: "90%" },
  sheetTitle: { fontSize: g.fontSize.lg, fontWeight: g.fontWeight.bold, color: g.colors.textPrimary, marginBottom: g.spacing.lg },
  fieldLabel: { fontSize: g.fontSize.sm, fontWeight: "600", color: g.colors.textPrimary, marginBottom: 6, marginTop: g.spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: g.borderRadius.full, borderWidth: 1, borderColor: g.colors.border },
  chipActive: { backgroundColor: g.colors.primary, borderColor: g.colors.primary },
  chipText: { fontSize: 12, color: g.colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  statusBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: g.borderRadius.md, borderWidth: 1, borderColor: g.colors.border },
  statusBtnText: { fontSize: 12, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: g.colors.border, borderRadius: g.borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: g.fontSize.sm, color: g.colors.textPrimary, backgroundColor: g.colors.background },
  cancelRow: { marginTop: g.spacing.md, alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: g.fontSize.sm, color: g.colors.textSecondary },
});
