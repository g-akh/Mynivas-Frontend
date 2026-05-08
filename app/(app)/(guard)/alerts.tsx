/**
 * Guard — Security Alerts & Incident Reporting
 * - Report incidents (SECURITY_INCIDENT category via complaints API)
 * - View past incidents reported by this guard
 * - Flag: Suspicious activity | Unknown visitor | Emergency alert
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "../../../src/components/common/AppHeader";
import EmptyState from "../../../src/components/common/EmptyState";
import LoadingButton from "../../../src/components/common/LoadingButton";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import StatusBadge from "../../../src/components/common/StatusBadge";
import { useComplaintList } from "../../../src/hooks/useComplaints";
import { createComplaint } from "../../../src/api/complaints";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatRelative } from "../../../src/utils/format";
import type { Complaint } from "../../../src/types";

// ─── alert types ─────────────────────────────────────────────────────────────

const ALERT_TYPES: { key: string; label: string; icon: string; color: string; priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" }[] = [
  { key: "Suspicious Activity",  label: "Suspicious Activity",  icon: "visibility",      color: "#E67E22", priority: "HIGH"     },
  { key: "Unknown Visitor",      label: "Unknown Visitor",      icon: "person-off",      color: "#F39C12", priority: "MEDIUM"   },
  { key: "Emergency",            label: "Emergency",            icon: "emergency",       color: "#E74C3C", priority: "CRITICAL" },
  { key: "Trespassing",          label: "Trespassing",          icon: "block",           color: "#C0392B", priority: "HIGH"     },
  { key: "Property Damage",      label: "Property Damage",      icon: "report-problem",  color: "#8E44AD", priority: "HIGH"     },
  { key: "Noise Complaint",      label: "Noise Complaint",      icon: "volume-off",      color: "#3498DB", priority: "LOW"      },
  { key: "Other Incident",       label: "Other Incident",       icon: "flag",            color: "#7F8C8D", priority: "MEDIUM"   },
];

// ─── Incident card ────────────────────────────────────────────────────────────

function IncidentCard({ item }: { item: Complaint }) {
  const priorityColor: Record<string, string> = { LOW: "#27AE60", MEDIUM: "#F39C12", HIGH: "#E67E22", CRITICAL: "#E74C3C" };
  const color = priorityColor[item.priority] ?? theme.colors.textSecondary;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.iconWrap}>
          <MaterialIcons name="report" size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.category}>{item.category.replace(/_/g, " ")}</Text>
          <Text style={s.description} numberOfLines={2}>{item.description}</Text>
        </View>
        <View style={s.rightCol}>
          <StatusBadge status={item.status} size="sm" />
          <View style={[s.priorityChip, { backgroundColor: color + "15", borderColor: color + "44" }]}>
            <Text style={[s.priorityText, { color }]}>{item.priority}</Text>
          </View>
        </View>
      </View>
      <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
    </View>
  );
}

// ─── Report modal ─────────────────────────────────────────────────────────────

function ReportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [alertType, setAlertType] = useState(ALERT_TYPES[0]);
  const [description, setDescription] = useState("");

  const { mutate: report, isPending } = useMutation({
    mutationFn: () =>
      createComplaint({
        tenantId:    user?.tenantId ?? "",
        communityId: user?.communityId ?? "",
        unitId:      user?.communityId ?? "",
        category:    "SECURITY_INCIDENT",
        priority:    alertType.priority,
        description: `[${alertType.key}] ${description.trim()}`,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["complaints"] });
      showToast({ type: "success", message: "Incident reported to management" });
      setDescription("");
      setAlertType(ALERT_TYPES[0]);
      onClose();
    },
    onError: (err: any) => {
      showToast({ type: "error", message: err?.response?.data?.message ?? "Failed to report incident" });
    },
  });

  const handleSubmit = () => {
    if (!description.trim()) {
      showToast({ type: "error", message: "Please describe the incident" });
      return;
    }
    report();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <ScrollView style={s.sheet} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={s.sheetTitle}>Report Incident</Text>

          <Text style={s.fieldLabel}>Alert Type</Text>
          <View style={s.typeGrid}>
            {ALERT_TYPES.map((t) => {
              const active = alertType.key === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[s.typeChip, active && { backgroundColor: t.color + "15", borderColor: t.color }]}
                  onPress={() => setAlertType(t)}
                >
                  <MaterialIcons name={t.icon as any} size={16} color={active ? t.color : theme.colors.textSecondary} />
                  <Text style={[s.typeChipText, active && { color: t.color, fontWeight: "700" }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Priority indicator */}
          <View style={s.priorityRow}>
            <MaterialIcons name="flag" size={14} color={theme.colors.textSecondary} />
            <Text style={s.priorityLabel}>Priority: </Text>
            <Text style={[s.priorityValue, { color: alertType.priority === "CRITICAL" ? "#E74C3C" : alertType.priority === "HIGH" ? "#E67E22" : theme.colors.textSecondary }]}>
              {alertType.priority}
            </Text>
          </View>

          <Text style={s.fieldLabel}>Description *</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened, location, persons involved…"
            placeholderTextColor={theme.colors.textDisabled}
            multiline
            numberOfLines={4}
          />

          <LoadingButton
            title="Report Incident"
            loadingTitle="Reporting…"
            onPress={handleSubmit}
            isLoading={isPending}
            style={{ marginTop: theme.spacing.lg, backgroundColor: "#E74C3C" }}
          />
          <TouchableOpacity style={s.cancelRow} onPress={onClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const [showReport, setShowReport] = useState(false);
  // Guards see their own incidents (backend filters by createdBy for GUARD role)
  const { data: incidents = [], isLoading, refetch } = useComplaintList(undefined, undefined);

  // Filter to SECURITY_INCIDENT only (guard-created)
  const securityIncidents = incidents.filter((c) => c.category === "SECURITY_INCIDENT");

  const openCount    = securityIncidents.filter((c) => !["RESOLVED", "CLOSED"].includes(c.status)).length;
  const resolvedCount = securityIncidents.filter((c) => ["RESOLVED", "CLOSED"].includes(c.status)).length;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Security Alerts" />

      {/* Counts bar */}
      <View style={s.countsBar}>
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: "#E74C3C" }]}>{openCount}</Text>
          <Text style={s.countLabel}>Open</Text>
        </View>
        <View style={s.countSep} />
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: theme.colors.success }]}>{resolvedCount}</Text>
          <Text style={s.countLabel}>Resolved</Text>
        </View>
        <View style={s.countSep} />
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: theme.colors.textPrimary }]}>{securityIncidents.length}</Text>
          <Text style={s.countLabel}>Total</Text>
        </View>
      </View>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : (
        <FlatList
          data={securityIncidents}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => <IncidentCard item={item} />}
          ListEmptyComponent={
            <EmptyState emoji="🔒" title="No incidents reported" subtitle="Tap the alert button to report a security incident." />
          }
          contentContainerStyle={s.listContent}
        />
      )}

      {/* Emergency / Report FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowReport(true)}>
        <MaterialIcons name="add-alert" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <ReportModal visible={showReport} onClose={() => setShowReport(false)} />
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  countsBar: { flexDirection: "row", backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: 12 },
  countItem: { flex: 1, alignItems: "center", gap: 2 },
  countNum: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold },
  countLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  countSep: { width: 1, backgroundColor: theme.colors.border },
  listContent: { padding: theme.spacing.md, paddingBottom: 90 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.shadow.sm },
  cardHeader: { flexDirection: "row", gap: 10, marginBottom: 6 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#E74C3C20", justifyContent: "center", alignItems: "center" },
  category: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  description: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2, lineHeight: 16 },
  rightCol: { alignItems: "flex-end", gap: 4 },
  priorityChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: theme.borderRadius.full, borderWidth: 1 },
  priorityText: { fontSize: 10, fontWeight: theme.fontWeight.semibold },
  timeText: { fontSize: 11, color: theme.colors.textDisabled },
  fab: { position: "absolute", bottom: 28, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: "#E74C3C", justifyContent: "center", alignItems: "center", ...theme.shadow.lg },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.xl, maxHeight: "90%" },
  sheetTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary, marginBottom: 8, marginTop: theme.spacing.md },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border },
  typeChipText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  priorityRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: theme.spacing.sm },
  priorityLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  priorityValue: { fontSize: theme.fontSize.xs, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, backgroundColor: theme.colors.background },
  textArea: { height: 100, textAlignVertical: "top" },
  cancelRow: { marginTop: theme.spacing.md, alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
