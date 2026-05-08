/**
 * Guard Gate Dashboard
 * - Pending Approval / Checked-In list with approve/reject/checkout actions
 * - New Entry modal: Guest | Delivery (Swiggy/Amazon etc.) | Service/Maid | Vendor
 * - Kid Exit: extra confirmation step on checkout
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SectionList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import AppHeader from "../../../src/components/common/AppHeader";
import StatusBadge from "../../../src/components/common/StatusBadge";
import EmptyState from "../../../src/components/common/EmptyState";
import LoadingButton from "../../../src/components/common/LoadingButton";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import {
  useVisitorList,
  useApproveVisitor,
  useRejectVisitor,
  useCheckoutVisitor,
  useCreateVisitor,
} from "../../../src/hooks/useVisitors";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatRelative } from "../../../src/utils/format";
import type { Visitor, VisitorType } from "../../../src/types";

// ─── constants ───────────────────────────────────────────────────────────────

const VISITOR_TYPE_COLOR: Record<string, string> = {
  GUEST:    "#3498DB",
  COURIER:  "#F39C12",
  SERVICE:  "#9B59B6",
  VENDOR:   "#E67E22",
  DELIVERY: "#F39C12",
};

const ENTRY_TYPES: { key: VisitorType; label: string; icon: string; color: string; hint: string }[] = [
  { key: "GUEST",   label: "Guest",    icon: "person",          color: "#3498DB", hint: "Family / friend visit" },
  { key: "COURIER", label: "Delivery", icon: "local-shipping",  color: "#F39C12", hint: "Swiggy, Amazon, Zomato…" },
  { key: "SERVICE", label: "Service",  icon: "home-repair-service", color: "#9B59B6", hint: "Maid, plumber, electrician…" },
  { key: "VENDOR",  label: "Vendor",   icon: "storefront",      color: "#E67E22", hint: "Supplier / contractor" },
];

// ─── New Entry Modal ─────────────────────────────────────────────────────────

function NewEntryModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { user } = useAuthStore();
  const { mutate: createVisitor, isPending } = useCreateVisitor();

  const [selectedType, setSelectedType] = useState<VisitorType>("GUEST");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [unitNumber, setUnitNumber] = useState("");

  const reset = useCallback(() => {
    setSelectedType("GUEST");
    setName("");
    setPhone("");
    setUnitNumber("");
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!name.trim()) {
      showToast({ type: "error", message: "Visitor name is required" });
      return;
    }
    if (!user) return;

    createVisitor(
      {
        tenantId:    user.tenantId,
        communityId: user.communityId,
        unitId:      user.communityId, // guard doesn't always know unit; use communityId as fallback
        visitorName: name.trim(),
        visitorPhone: phone.trim() || "0000000000",
        visitorType: selectedType,
      },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Entry logged — waiting for resident approval" });
          handleClose();
        },
        onError: () => showToast({ type: "error", message: "Failed to log entry" }),
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={handleClose}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>New Entry</Text>

          {/* Type selector */}
          <Text style={s.fieldLabel}>Visitor Type</Text>
          <View style={s.typeGrid}>
            {ENTRY_TYPES.map((t) => {
              const active = selectedType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[s.typeCard, active && { borderColor: t.color, backgroundColor: t.color + "15" }]}
                  onPress={() => setSelectedType(t.key)}
                >
                  <MaterialIcons name={t.icon as any} size={22} color={active ? t.color : theme.colors.textSecondary} />
                  <Text style={[s.typeCardLabel, active && { color: t.color, fontWeight: "700" }]}>{t.label}</Text>
                  <Text style={s.typeCardHint}>{t.hint}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.fieldLabel}>
            {selectedType === "COURIER" ? "Delivery Partner / Item" : "Visitor Name"} *
          </Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder={selectedType === "COURIER" ? "e.g. Swiggy — Rahul Kumar" : "Full name"}
            placeholderTextColor={theme.colors.textDisabled}
          />

          <Text style={s.fieldLabel}>
            Phone {selectedType === "COURIER" ? "(optional)" : "(optional)"}
          </Text>
          <TextInput
            style={s.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+919876543210"
            placeholderTextColor={theme.colors.textDisabled}
            keyboardType="phone-pad"
          />

          {selectedType !== "COURIER" && (
            <>
              <Text style={s.fieldLabel}>Unit / Flat (optional)</Text>
              <TextInput
                style={s.input}
                value={unitNumber}
                onChangeText={setUnitNumber}
                placeholder="e.g. A-101"
                placeholderTextColor={theme.colors.textDisabled}
              />
            </>
          )}

          <LoadingButton
            title="Log Entry"
            loadingTitle="Logging…"
            onPress={handleSubmit}
            isLoading={isPending}
            style={{ marginTop: theme.spacing.lg }}
          />
          <TouchableOpacity style={s.cancelRow} onPress={handleClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Visitor card ────────────────────────────────────────────────────────────

function VisitorGateCard({
  item,
  section,
}: {
  item: Visitor;
  section: "pending" | "checked_in";
}) {
  const { mutate: approve, isPending: approving } = useApproveVisitor();
  const { mutate: reject,  isPending: rejecting  } = useRejectVisitor();
  const { mutate: checkout, isPending: checkingOut } = useCheckoutVisitor();
  const busy = approving || rejecting || checkingOut;
  const typeColor = VISITOR_TYPE_COLOR[item.visitor_type] ?? theme.colors.primary;

  const handleCheckOut = () => {
    // Kid exit confirmation — always confirm checkout
    Alert.alert(
      "Confirm Exit",
      `Confirm exit for ${item.visitor_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Exit",
          style: "default",
          onPress: () =>
            checkout(
              { id: item.id },
              { onSuccess: () => showToast({ type: "success", message: "Visitor checked out" }) }
            ),
        },
      ]
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
            {item.visitor_phone ? <Text style={s.visitorPhone}>{item.visitor_phone}</Text> : null}
          </View>
        </View>
        <View style={s.headerRight}>
          <View style={[s.typeChip, { backgroundColor: typeColor + "15", borderColor: typeColor + "40" }]}>
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
            onPress={() =>
              reject(
                { id: item.id, reason: "Rejected at gate" },
                { onSuccess: () => showToast({ type: "success", message: "Visitor rejected" }) }
              )
            }
            disabled={busy}
          >
            <MaterialIcons name="close" size={16} color={theme.colors.danger} />
            <Text style={[s.actionBtnText, { color: theme.colors.danger }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.approveBtn]}
            onPress={() =>
              approve(
                { id: item.id },
                { onSuccess: () => showToast({ type: "success", message: "Visitor approved" }) }
              )
            }
            disabled={busy}
          >
            <MaterialIcons name="check" size={16} color="#FFFFFF" />
            <Text style={[s.actionBtnText, { color: "#FFFFFF" }]}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}

      {section === "checked_in" && (
        <TouchableOpacity style={[s.actionBtn, s.checkOutBtn, { flex: 0 }]} onPress={handleCheckOut} disabled={busy}>
          <MaterialIcons name="logout" size={16} color={theme.colors.primary} />
          <Text style={[s.actionBtnText, { color: theme.colors.primary }]}>Check Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function GuardGateScreen() {
  const qc = useQueryClient();
  const [showNewEntry, setShowNewEntry] = useState(false);

  const pendingQuery   = useVisitorList("PENDING_APPROVAL");
  const checkedInQuery = useVisitorList("CHECKED_IN");

  useEffect(() => {
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["visitors"] });
    }, 30_000);
    return () => clearInterval(interval);
  }, [qc]);

  const isLoading = pendingQuery.isLoading || checkedInQuery.isLoading;
  const pendingVisitors   = pendingQuery.data ?? [];
  const checkedInVisitors = checkedInQuery.data ?? [];

  const sections = [
    { title: "Pending Approval", key: "pending"    as const, data: pendingVisitors },
    { title: "Checked In",       key: "checked_in" as const, data: checkedInVisitors },
  ].filter((s) => s.data.length > 0 || s.key === "pending");

  const handleRefresh = () => {
    pendingQuery.refetch();
    checkedInQuery.refetch();
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader
        title="Gate"
        rightAction={{ icon: "refresh", onPress: handleRefresh }}
      />

      {/* Live counts */}
      <View style={s.countsBar}>
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: theme.colors.warning }]}>{pendingVisitors.length}</Text>
          <Text style={s.countLabel}>Pending</Text>
        </View>
        <View style={s.countSep} />
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: theme.colors.success }]}>{checkedInVisitors.length}</Text>
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
            <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
          }
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{section.title} ({section.data.length})</Text>
              {section.key === "pending" && section.data.length > 0 && (
                <View style={s.sectionBadge}>
                  <Text style={s.sectionBadgeText}>{section.data.length}</Text>
                </View>
              )}
            </View>
          )}
          renderItem={({ item, section }) => <VisitorGateCard item={item} section={section.key} />}
          ListEmptyComponent={
            <EmptyState emoji="🚪" title="No visitors" subtitle="Tap + to log a new entry." />
          }
          contentContainerStyle={s.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB — New Entry */}
      <TouchableOpacity style={s.fab} onPress={() => setShowNewEntry(true)}>
        <MaterialIcons name="person-add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <NewEntryModal visible={showNewEntry} onClose={() => setShowNewEntry(false)} />
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.colors.background },
  countsBar: { flexDirection: "row", backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: 12 },
  countItem: { flex: 1, alignItems: "center", gap: 2 },
  countNum:  { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold },
  countLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  countSep:  { width: 1, backgroundColor: theme.colors.border },
  listContent: { padding: theme.spacing.md, paddingBottom: 90 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  sectionTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  sectionBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.danger, justifyContent: "center", alignItems: "center", paddingHorizontal: 5 },
  sectionBadgeText: { fontSize: 11, color: "#FFFFFF", fontWeight: theme.fontWeight.bold },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.shadow.sm },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spacing.sm },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  typeCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  visitorName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  visitorPhone: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  headerRight: { alignItems: "flex-end", gap: 4 },
  typeChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: theme.borderRadius.full, borderWidth: 1 },
  typeText: { fontSize: 10, fontWeight: theme.fontWeight.semibold },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: theme.spacing.sm },
  timeText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, flexDirection: "row", height: 38, borderRadius: theme.borderRadius.md, alignItems: "center", justifyContent: "center", gap: 5 },
  rejectBtn: { backgroundColor: theme.colors.danger + "15", borderWidth: 1, borderColor: theme.colors.danger + "55" },
  approveBtn: { backgroundColor: theme.colors.success },
  checkOutBtn: { backgroundColor: theme.colors.primary + "15", borderWidth: 1, borderColor: theme.colors.primary + "55" },
  actionBtnText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },

  fab: { position: "absolute", bottom: 28, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center", ...theme.shadow.lg },

  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.xl, maxHeight: "90%" },
  sheetTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary, marginBottom: 6, marginTop: theme.spacing.md },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  typeCard: { width: "47%", borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: 10, gap: 4, alignItems: "center" },
  typeCardLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.textPrimary },
  typeCardHint: { fontSize: 10, color: theme.colors.textSecondary, textAlign: "center" },
  input: { height: 48, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, backgroundColor: theme.colors.background },
  cancelRow: { marginTop: theme.spacing.md, alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
