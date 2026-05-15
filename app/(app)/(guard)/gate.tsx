/**
 * Guard Gate Dashboard — Purple design
 * Pending Approval / Checked-In with approve/reject/checkout actions
 * New Entry modal: Guest | Delivery | Service | Vendor
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, RefreshControl,
  SectionList, Modal, TextInput, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";
import StatusBadge from "../../../src/components/common/StatusBadge";
import EmptyState from "../../../src/components/common/EmptyState";
import LoadingButton from "../../../src/components/common/LoadingButton";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import {
  useVisitorList, useApproveVisitor, useRejectVisitor,
  useCheckinVisitor, useCheckoutVisitor, useCreateVisitor,
} from "../../../src/hooks/useVisitors";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { guardTheme as g } from "../../../src/theme/guardTheme";
import { formatRelative } from "../../../src/utils/format";
import type { Visitor, VisitorType } from "../../../src/types";

/* ─── Visitor type config ────────────────────────────────────────────── */
const VISITOR_TYPE_COLOR: Record<string, string> = {
  GUEST:    "#7B1FA2",
  COURIER:  "#FB8C00",
  SERVICE:  "#6E3482",
  VENDOR:   "#EF6C00",
  DELIVERY: "#FB8C00",
};

const ENTRY_TYPES: {
  key: VisitorType; label: string; icon: string; color: string; hint: string;
}[] = [
  { key: "GUEST",   label: "Guest",    icon: "person",               color: "#7B1FA2", hint: "Family / friend visit"         },
  { key: "COURIER", label: "Delivery", icon: "local-shipping",       color: "#FB8C00", hint: "Swiggy, Amazon, Zomato…"       },
  { key: "SERVICE", label: "Service",  icon: "home-repair-service",  color: "#6E3482", hint: "Maid, plumber, electrician…"   },
  { key: "VENDOR",  label: "Vendor",   icon: "storefront",           color: "#EF6C00", hint: "Supplier / contractor"         },
];

/* ─── New Entry Modal ────────────────────────────────────────────────── */
function NewEntryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  const { mutate: createVisitor, isPending } = useCreateVisitor();

  const [selectedType, setSelectedType] = useState<VisitorType>("GUEST");
  const [name,         setName]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [unitNumber,   setUnitNumber]   = useState("");

  const reset       = useCallback(() => { setSelectedType("GUEST"); setName(""); setPhone(""); setUnitNumber(""); }, []);
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!name.trim()) { showToast({ type: "error", message: "Visitor name is required" }); return; }
    if (!user) return;
    createVisitor(
      {
        tenantId:     user.tenantId,
        communityId:  user.communityId,
        unitId:       user.communityId,
        visitorName:  name.trim(),
        visitorPhone: phone.trim() || "0000000000",
        visitorType:  selectedType,
        unitNumber:   unitNumber.trim() || undefined,
      },
      {
        onSuccess: () => { showToast({ type: "success", message: "Entry logged — waiting for resident approval" }); handleClose(); },
        onError:   () =>   showToast({ type: "error",   message: "Failed to log entry" }),
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={handleClose}>
        <View style={s.sheet}>
          {/* Sheet handle */}
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>New Entry</Text>

          <Text style={s.fieldLabel}>Visitor Type</Text>
          <View style={s.typeGrid}>
            {ENTRY_TYPES.map((t) => {
              const active = selectedType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[s.typeCard, active && { borderColor: t.color, backgroundColor: t.color + "18" }]}
                  onPress={() => setSelectedType(t.key)}
                >
                  <View style={[s.typeCardIcon, { backgroundColor: active ? t.color : g.colors.border }]}>
                    <MaterialIcons name={t.icon as any} size={20} color={active ? "#FFFFFF" : g.colors.textSecondary} />
                  </View>
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
            placeholderTextColor={g.colors.textDisabled}
          />

          <Text style={s.fieldLabel}>Phone (optional)</Text>
          <TextInput
            style={s.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+919876543210"
            placeholderTextColor={g.colors.textDisabled}
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
                placeholderTextColor={g.colors.textDisabled}
              />
            </>
          )}

          <LoadingButton
            title="Log Entry"
            loadingTitle="Logging…"
            onPress={handleSubmit}
            isLoading={isPending}
            style={{ marginTop: g.spacing.lg, backgroundColor: g.colors.primary }}
          />
          <TouchableOpacity style={s.cancelRow} onPress={handleClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

/* ─── Visitor Gate Card ──────────────────────────────────────────────── */
function VisitorGateCard({ item, section }: { item: Visitor; section: "pending" | "approved" | "checked_in" }) {
  const { mutate: approve,  isPending: approving   } = useApproveVisitor();
  const { mutate: reject,   isPending: rejecting    } = useRejectVisitor();
  const { mutate: checkin,  isPending: checkingIn   } = useCheckinVisitor();
  const { mutate: checkout, isPending: checkingOut  } = useCheckoutVisitor();
  const busy      = approving || rejecting || checkingIn || checkingOut;
  const typeColor = VISITOR_TYPE_COLOR[item.visitor_type] ?? g.colors.primary;

  const initials = (item.visitor_name ?? "?")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const handleCheckOut = () =>
    Alert.alert("Confirm Exit", `Confirm exit for ${item.visitor_name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm Exit", style: "default",
        onPress: () => checkout({ id: item.id }, {
          onSuccess: () => showToast({ type: "success", message: "Visitor checked out" }),
        }),
      },
    ]);

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        {/* Avatar */}
        <View style={[s.avatar, { backgroundColor: typeColor + "22" }]}>
          <Text style={[s.avatarText, { color: typeColor }]}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={s.visitorName}>{item.visitor_name}</Text>
          {item.visitor_phone ? <Text style={s.visitorPhone}>{item.visitor_phone}</Text> : null}
          <View style={s.metaRow}>
            <View style={[s.typeChip, { backgroundColor: typeColor + "18", borderColor: typeColor + "44" }]}>
              <Text style={[s.typeText, { color: typeColor }]}>{item.visitor_type}</Text>
            </View>
            <View style={s.timeRow}>
              <MaterialIcons name="access-time" size={11} color={g.colors.textDisabled} />
              <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
            </View>
          </View>
        </View>

        <StatusBadge status={item.status} size="sm" />
      </View>

      {/* Actions */}
      {section === "pending" && (
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, s.rejectBtn]}
            onPress={() => reject({ id: item.id, reason: "Rejected at gate" }, {
              onSuccess: () => showToast({ type: "success", message: "Visitor rejected" }),
            })}
            disabled={busy}
          >
            {rejecting
              ? <ActivityIndicator size={14} color={g.colors.danger} />
              : <><MaterialIcons name="close" size={16} color={g.colors.danger} /><Text style={[s.actionBtnText, { color: g.colors.danger }]}>Reject</Text></>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.approveBtn]}
            onPress={() => approve({ id: item.id }, {
              onSuccess: () => showToast({ type: "success", message: "Visitor approved" }),
            })}
            disabled={busy}
          >
            {approving
              ? <ActivityIndicator size={14} color="#FFFFFF" />
              : <><MaterialIcons name="check" size={16} color="#FFFFFF" /><Text style={[s.actionBtnText, { color: "#FFFFFF" }]}>Approve</Text></>}
          </TouchableOpacity>
        </View>
      )}

      {section === "approved" && (
        <TouchableOpacity
          style={[s.actionBtn, s.approveBtn]}
          onPress={() => checkin({ id: item.id }, {
            onSuccess: () => showToast({ type: "success", message: "Visitor checked in" }),
          })}
          disabled={busy}
        >
          {checkingIn
            ? <ActivityIndicator size={14} color="#FFFFFF" />
            : <><MaterialIcons name="login" size={16} color="#FFFFFF" /><Text style={[s.actionBtnText, { color: "#FFFFFF" }]}>Check In</Text></>}
        </TouchableOpacity>
      )}

      {section === "checked_in" && (
        <TouchableOpacity
          style={[s.actionBtn, s.checkOutBtn]}
          onPress={handleCheckOut}
          disabled={busy}
        >
          <MaterialIcons name="logout" size={16} color={g.colors.primary} />
          <Text style={[s.actionBtnText, { color: g.colors.primary }]}>Check Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────────── */
export default function GuardGateScreen() {
  const qc = useQueryClient();
  const [showNewEntry, setShowNewEntry] = useState(false);

  const pendingQuery   = useVisitorList("PENDING_APPROVAL");
  const approvedQuery  = useVisitorList("APPROVED");
  const checkedInQuery = useVisitorList("CHECKED_IN");

  useEffect(() => {
    const interval = setInterval(() => qc.invalidateQueries({ queryKey: ["visitors"] }), 30_000);
    return () => clearInterval(interval);
  }, [qc]);

  const isLoading         = pendingQuery.isLoading || approvedQuery.isLoading || checkedInQuery.isLoading;
  const pendingVisitors   = pendingQuery.data   ?? [];
  const approvedVisitors  = approvedQuery.data  ?? [];
  const checkedInVisitors = checkedInQuery.data ?? [];

  const sections = [
    { title: "Pending Approval",        key: "pending"    as const, data: pendingVisitors   },
    { title: "Pre-Approved — Check In", key: "approved"   as const, data: approvedVisitors  },
    { title: "Checked In",              key: "checked_in" as const, data: checkedInVisitors },
  ].filter((sec) => sec.data.length > 0 || sec.key === "pending");

  const handleRefresh = () => { pendingQuery.refetch(); approvedQuery.refetch(); checkedInQuery.refetch(); };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* ── Gradient Header ──────────────────────────────────── */}
      <LinearGradient
        colors={["#49225B", "#6E3482", "#7B3F9A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerSub}>Security Dashboard</Text>
            <Text style={s.headerTitle}>Gate Control</Text>
          </View>
          <TouchableOpacity style={s.refreshBtn} onPress={handleRefresh}>
            <MaterialIcons name="refresh" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statNum}>{pendingVisitors.length}</Text>
            <Text style={s.statLabel}>Pending</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statNum}>{approvedVisitors.length}</Text>
            <Text style={s.statLabel}>Pre-Approved</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statNum}>{checkedInVisitors.length}</Text>
            <Text style={s.statLabel}>Inside</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <MaterialIcons name="autorenew" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={s.statLabel}>30s auto</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Visitor List ─────────────────────────────────────── */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={g.colors.primary} />
          }
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              {section.data.length > 0 && (
                <View style={[s.sectionBadge,
                  { backgroundColor: section.key === "pending" ? g.colors.danger : g.colors.success }]}>
                  <Text style={s.sectionBadgeText}>{section.data.length}</Text>
                </View>
              )}
            </View>
          )}
          renderItem={({ item, section }) => (
            <VisitorGateCard item={item} section={section.key} />
          )}
          ListEmptyComponent={
            <EmptyState emoji="🚪" title="No visitors" subtitle="Tap + to log a new entry." />
          }
          contentContainerStyle={s.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* ── FAB ──────────────────────────────────────────────── */}
      <TouchableOpacity style={s.fab} onPress={() => setShowNewEntry(true)}>
        <MaterialIcons name="person-add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <NewEntryModal visible={showNewEntry} onClose={() => setShowNewEntry(false)} />
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: g.colors.background },

  /* Header */
  header:      { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  headerTop:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "500", marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
  },

  statsRow:    { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 14 },
  statBox:     { flex: 1, alignItems: "center", gap: 2 },
  statNum:     { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  statLabel:   { fontSize: 11, color: "rgba(255,255,255,0.75)" },
  statDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.25)" },

  /* List */
  listContent:  { padding: 16, paddingBottom: 100 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: g.colors.textPrimary, textTransform: "uppercase", letterSpacing: 0.4 },
  sectionBadge: { minWidth: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center", paddingHorizontal: 6 },
  sectionBadgeText: { fontSize: 11, color: "#FFFFFF", fontWeight: "700" },

  /* Card */
  card: {
    backgroundColor: g.colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: g.colors.border,
    padding: 16, marginBottom: 10,
    ...g.shadow.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
  },
  avatarText:   { fontSize: 16, fontWeight: "800" },
  visitorName:  { fontSize: 15, fontWeight: "700", color: g.colors.textPrimary },
  visitorPhone: { fontSize: 12, color: g.colors.textSecondary, marginTop: 1 },
  metaRow:      { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 },
  typeChip:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  typeText:     { fontSize: 11, fontWeight: "600" },
  timeRow:      { flexDirection: "row", alignItems: "center", gap: 3 },
  timeText:     { fontSize: 11, color: g.colors.textDisabled },

  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: "row", height: 40,
    borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 6,
  },
  rejectBtn:   { backgroundColor: g.colors.danger + "14", borderWidth: 1, borderColor: g.colors.danger + "55" },
  approveBtn:  { backgroundColor: g.colors.primary },
  checkOutBtn: { backgroundColor: g.colors.primary + "14", borderWidth: 1, borderColor: g.colors.primary + "55" },
  actionBtnText: { fontSize: 13, fontWeight: "700" },

  /* FAB */
  fab: {
    position: "absolute", bottom: 30, right: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: g.colors.primary,
    justifyContent: "center", alignItems: "center",
    ...g.shadow.lg,
  },

  /* Bottom sheet */
  overlay: { flex: 1, backgroundColor: "rgba(73,34,91,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: g.colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, maxHeight: "92%",
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: g.colors.border,
    alignSelf: "center", marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: g.colors.textPrimary, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: g.colors.textPrimary, marginBottom: 8, marginTop: 14 },
  typeGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  typeCard: {
    width: "47%", borderWidth: 1.5, borderColor: g.colors.border,
    borderRadius: 14, padding: 12, gap: 6, alignItems: "center",
    backgroundColor: g.colors.surface,
  },
  typeCardIcon:  { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  typeCardLabel: { fontSize: 13, fontWeight: "600", color: g.colors.textPrimary },
  typeCardHint:  { fontSize: 10, color: g.colors.textSecondary, textAlign: "center" },
  input: {
    height: 48, borderWidth: 1.5, borderColor: g.colors.border,
    borderRadius: 10, paddingHorizontal: 14, fontSize: 14,
    color: g.colors.textPrimary, backgroundColor: g.colors.background,
  },
  cancelRow: { marginTop: 14, alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: 14, color: g.colors.textSecondary, fontWeight: "600" },
});
