/**
 * Resident Visitors — Phase 09
 * Pre-register visitors + approve pending visitors + show history
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import LoadingButton from "../../../src/components/common/LoadingButton";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import {
  useVisitorPassList, useCreateVisitorPass, useVisitorList,
  useApproveVisitor, useRejectVisitor,
} from "../../../src/hooks/useVisitors";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatDateTime, formatRelative } from "../../../src/utils/format";
import type { VisitorPass } from "../../../src/types";

type Tab = "REGISTER" | "PASSES" | "HISTORY";

/* ─── Pass Card (My Passes tab) ─────────────────────────────────────── */
function PassCard({ item }: { item: VisitorPass }) {
  const [showQR, setShowQR] = useState(false);
  const isExpired = new Date(item.expires_at) < new Date();

  const initials = (item.visitor_name ?? "?")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <View style={[s.card, isExpired && s.cardExpired]}>
      <View style={s.cardHeader}>
        <View style={s.passAvatar}>
          <Text style={s.passAvatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.visitorName}>{item.visitor_name}</Text>
          <Text style={s.passTime}>Expected: {formatDateTime(item.expected_at)}</Text>
        </View>
        <View style={[s.statusChip, {
          backgroundColor: isExpired ? theme.colors.textDisabled + "20" : theme.colors.success + "20",
        }]}>
          <Text style={[s.statusText, {
            color: isExpired ? theme.colors.textDisabled : theme.colors.success,
          }]}>
            {isExpired ? "Expired" : "Active"}
          </Text>
        </View>
      </View>
      <Text style={s.expiry}>Expires: {formatDateTime(item.expires_at)}</Text>
      {!isExpired && (
        <TouchableOpacity style={s.qrBtn} onPress={() => setShowQR(true)}>
          <MaterialIcons name="qr-code" size={16} color={theme.colors.primary} />
          <Text style={s.qrBtnText}>Show QR Pass</Text>
        </TouchableOpacity>
      )}

      {/* QR Modal */}
      <Modal visible={showQR} transparent animationType="fade">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowQR(false)}>
          <View style={s.qrModalWrap}>
            <TouchableOpacity style={s.qrModalClose} onPress={() => setShowQR(false)}>
              <MaterialIcons name="close" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={s.qrModalTitle}>Gate pass</Text>
            <LinearGradient
              colors={["#1565C0", "#0D2766"]}
              style={s.qrGradCard}
            >
              <View style={s.qrContainer}>
                <QRCode value={item.id} size={180} color={theme.colors.primaryDark} backgroundColor="#FFFFFF" />
              </View>
              <Text style={s.qrGradName}>{item.visitor_name}</Text>
              <Text style={s.qrGradHint}>Show this at the gate</Text>
            </LinearGradient>
            <TouchableOpacity
              style={s.preApproveBtn}
              onPress={() => setShowQR(false)}
            >
              <MaterialIcons name="flash-on" size={18} color="#FFFFFF" />
              <Text style={s.preApproveBtnText}>Pre-approve a visitor</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/* ─── Date helpers ───────────────────────────────────────────────────── */
function formatDateForDisplay(date: Date | null): string {
  if (!date) return "";
  const y   = date.getFullYear();
  const m   = String(date.getMonth() + 1).padStart(2, "0");
  const d   = String(date.getDate()).padStart(2, "0");
  const h   = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}`;
}

type PickerField = "expectedAt" | "expiresAt";
type PickerMode  = "date" | "time";

/* ─── Register Form ──────────────────────────────────────────────────── */
function RegisterForm() {
  const { user } = useAuthStore();
  const { mutate: createPass, isPending } = useCreateVisitorPass();

  const [visitorName, setVisitorName] = useState("");
  const [expectedAt,  setExpectedAt]  = useState<Date | null>(null);
  const [expiresAt,   setExpiresAt]   = useState<Date | null>(null);
  const [pickerField, setPickerField] = useState<PickerField | null>(null);
  const [pickerMode,  setPickerMode]  = useState<PickerMode>("date");
  const [tempDate,    setTempDate]    = useState(new Date());

  const openPicker = useCallback((field: PickerField) => {
    const current = field === "expectedAt" ? expectedAt : expiresAt;
    setTempDate(current ?? new Date());
    setPickerField(field);
    setPickerMode("date");
  }, [expectedAt, expiresAt]);

  const onPickerChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (_event.type === "dismissed") { setPickerField(null); return; }
    if (!selectedDate || !pickerField) return;
    if (pickerMode === "date") {
      setTempDate(selectedDate);
      if (Platform.OS === "android") { setPickerMode("time"); }
      else { (pickerField === "expectedAt" ? setExpectedAt : setExpiresAt)(selectedDate); }
    } else {
      const combined = new Date(tempDate);
      combined.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      (pickerField === "expectedAt" ? setExpectedAt : setExpiresAt)(combined);
      setPickerField(null);
    }
  }, [pickerField, pickerMode, tempDate]);

  const handleSubmit = () => {
    if (!visitorName.trim()) { showToast({ type: "error", message: "Visitor name is required" }); return; }
    if (!expectedAt)          { showToast({ type: "error", message: "Expected arrival time is required" }); return; }
    if (!expiresAt)           { showToast({ type: "error", message: "Expiry time is required" }); return; }
    if (!user) return;

    createPass(
      {
        tenantId:    user.tenantId,
        unitId:      user.unitId ?? user.communityId,
        residentId:  user.id,
        visitorName: visitorName.trim(),
        expectedAt:  expectedAt.toISOString(),
        expiresAt:   expiresAt.toISOString(),
      },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Visitor pass created!" });
          setVisitorName(""); setExpectedAt(null); setExpiresAt(null);
        },
        onError: () => showToast({ type: "error", message: "Failed to create visitor pass" }),
      }
    );
  };

  return (
    <ScrollView contentContainerStyle={s.form}>
      <View style={s.formCard}>
        <Text style={s.formTitle}>Register a Visitor</Text>
        <Text style={s.formSubtitle}>Create a pass so your visitor can enter the community</Text>

        <Text style={s.fieldLabel}>Visitor Name *</Text>
        <TextInput
          style={s.input}
          value={visitorName}
          onChangeText={setVisitorName}
          placeholder="Enter visitor's full name"
          placeholderTextColor={theme.colors.textDisabled}
        />

        <Text style={s.fieldLabel}>Expected Arrival *</Text>
        <TouchableOpacity style={s.input} onPress={() => openPicker("expectedAt")}>
          <Text style={{ color: expectedAt ? theme.colors.textPrimary : theme.colors.textDisabled, lineHeight: 46 }}>
            {expectedAt ? formatDateForDisplay(expectedAt) : "Tap to select date & time"}
          </Text>
        </TouchableOpacity>

        <Text style={s.fieldLabel}>Pass Expires At *</Text>
        <TouchableOpacity style={s.input} onPress={() => openPicker("expiresAt")}>
          <Text style={{ color: expiresAt ? theme.colors.textPrimary : theme.colors.textDisabled, lineHeight: 46 }}>
            {expiresAt ? formatDateForDisplay(expiresAt) : "Tap to select date & time"}
          </Text>
        </TouchableOpacity>

        <LoadingButton
          title="Create Visitor Pass"
          loadingTitle="Creating..."
          onPress={handleSubmit}
          isLoading={isPending}
          style={{ marginTop: theme.spacing.lg }}
        />
      </View>

      {pickerField != null && (
        Platform.OS === "ios" ? (
          <Modal transparent animationType="fade">
            <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setPickerField(null)}>
              <View style={s.pickerModal}>
                <DateTimePicker
                  value={tempDate}
                  mode="datetime"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={(_e, d) => { if (d) setTempDate(d); }}
                />
                <TouchableOpacity
                  style={s.closeBtn}
                  onPress={() => {
                    (pickerField === "expectedAt" ? setExpectedAt : setExpiresAt)(tempDate);
                    setPickerField(null);
                  }}
                >
                  <Text style={s.closeBtnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={tempDate}
            mode={pickerMode}
            display="default"
            minimumDate={new Date()}
            onChange={onPickerChange}
          />
        )
      )}
    </ScrollView>
  );
}

/* ─── Pending Approval Card ──────────────────────────────────────────── */
function PendingCard({ item }: { item: any }) {
  const { mutate: approve, isPending: approving } = useApproveVisitor();
  const { mutate: reject,  isPending: rejecting  } = useRejectVisitor();
  const initials = (item.visitor_name ?? "?")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <View style={s.pendingCard}>
      <View style={[s.historyAvatar, { backgroundColor: theme.colors.primaryLight + "33" }]}>
        <Text style={[s.historyAvatarText, { color: theme.colors.primary }]}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.visitorName}>{item.visitor_name}</Text>
        <Text style={s.passTime}>{item.visitor_type ?? "Guest"} · {formatRelative(item.created_at)}</Text>
      </View>
      <TouchableOpacity
        style={s.okBtn}
        disabled={approving || rejecting}
        onPress={() => approve({ id: item.id }, {
          onSuccess: () => showToast({ type: "success", message: "Visitor approved" }),
          onError:   () => showToast({ type: "error",   message: "Failed to approve" }),
        })}
      >
        {approving
          ? <ActivityIndicator size={12} color="#fff" />
          : <Text style={s.okBtnText}>OK</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        style={s.denyCardBtn}
        disabled={approving || rejecting}
        onPress={() => reject({ id: item.id, reason: "Denied by resident" }, {
          onSuccess: () => showToast({ type: "success", message: "Visitor denied" }),
          onError:   () => showToast({ type: "error",   message: "Failed to deny" }),
        })}
      >
        <Text style={s.denyCardBtnText}>Deny</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── History Card ───────────────────────────────────────────────────── */
function HistoryCard({ item }: { item: any }) {
  const statusColor: Record<string, string> = {
    PENDING_APPROVAL: "#FB8C00",
    APPROVED:         "#43A047",
    CHECKED_IN:       "#1E88E5",
    CHECKED_OUT:      "#78909C",
    REJECTED:         "#E53935",
  };
  const color    = statusColor[item.status] ?? theme.colors.textSecondary;
  const initials = (item.visitor_name ?? "?")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const isOk = ["APPROVED", "CHECKED_IN", "CHECKED_OUT"].includes(item.status);

  return (
    <View style={s.historyCard}>
      <View style={[s.historyAvatar, { backgroundColor: color + "22" }]}>
        <Text style={[s.historyAvatarText, { color }]}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.visitorName}>{item.visitor_name}</Text>
        <Text style={s.passTime}>{item.visitor_type ?? "Guest"} · {formatRelative(item.created_at)}</Text>
      </View>
      <View style={[s.historyStatusDot, { backgroundColor: color + "22" }]}>
        <MaterialIcons
          name={isOk ? "check-circle" : "cancel"}
          size={22}
          color={color}
        />
      </View>
    </View>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────────── */
export default function ResidentVisitorsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("REGISTER");

  const { data: passes  = [], isLoading: passesLoading  } = useVisitorPassList();
  const { data: history = [], isLoading: historyLoading, refetch: refetchHistory } = useVisitorList(undefined);

  const pendingVisitors = history.filter((v: any) => v.status === "PENDING_APPROVAL");
  const todayVisitors   = history.filter((v: any) => {
    const d = new Date(v.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString() && v.status !== "PENDING_APPROVAL";
  });

  const TABS: { key: Tab; label: string }[] = [
    { key: "REGISTER", label: "Pre-register" },
    { key: "PASSES",   label: "My Passes"    },
    { key: "HISTORY",  label: "History"      },
  ];

  const totalCount   = history.length;
  const pendingCount = pendingVisitors.length;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={["#0D2766", "#1565C0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.header}
      >
        <Text style={s.headerTitle}>Visitors</Text>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{totalCount}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{pendingCount}</Text>
            <Text style={s.statLabel}>Pending</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{passes.length}</Text>
            <Text style={s.statLabel}>Passes</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Row */}
      <View style={s.tabRow}>
        {TABS.map(({ key, label }) => {
          const active = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {activeTab === "REGISTER" ? (
        <RegisterForm />
      ) : activeTab === "PASSES" ? (
        passesLoading ? <SkeletonList count={3} /> : (
          <FlatList
            data={passes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PassCard item={item} />}
            ListEmptyComponent={
              <EmptyState
                emoji="🎫"
                title="No passes yet"
                subtitle="Create a visitor pass to let guests into the community."
                actionLabel="Create Pass"
                onAction={() => setActiveTab("REGISTER")}
              />
            }
            contentContainerStyle={s.listContent}
          />
        )
      ) : historyLoading ? (
        <SkeletonList count={4} />
      ) : (
        <ScrollView
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetchHistory} tintColor={theme.colors.primary} />}
        >
          {/* Pending Approvals */}
          {pendingVisitors.length > 0 && (
            <>
              <Text style={s.sectionLabel}>Pending approval</Text>
              {pendingVisitors.map((v: any) => <PendingCard key={v.id} item={v} />)}
            </>
          )}

          {/* Today */}
          {todayVisitors.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 16 }]}>Today</Text>
              {todayVisitors.map((v: any) => <HistoryCard key={v.id} item={v} />)}
            </>
          )}

          {pendingVisitors.length === 0 && todayVisitors.length === 0 && (
            <EmptyState emoji="📋" title="No visitor history" subtitle="Your visitor activity will appear here." />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },

  /* Header */
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", marginBottom: 14 },
  statsRow:    { flexDirection: "row", alignItems: "center" },
  statItem:    { alignItems: "center", flex: 1 },
  statNum:     { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  statLabel:   { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.3)" },

  /* Tabs */
  tabRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabActive:     { borderBottomColor: theme.colors.primary },
  tabText:       { fontSize: 13, fontWeight: "500", color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.primary, fontWeight: "700" },

  /* Lists */
  listContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },

  /* Pending card */
  pendingCard: {
    backgroundColor: theme.colors.surface, borderRadius: 14,
    padding: 14, marginBottom: 10,
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  okBtn: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, alignItems: "center", minWidth: 52,
  },
  okBtnText:      { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  denyCardBtn: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, alignItems: "center", minWidth: 48,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  denyCardBtnText: { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary },

  /* History card */
  historyCard: {
    backgroundColor: theme.colors.surface, borderRadius: 14,
    padding: 14, marginBottom: 10,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  historyAvatar:     { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  historyAvatarText: { fontSize: 15, fontWeight: "700" },
  historyStatusDot:  { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },

  /* Pass Card */
  card: {
    backgroundColor: theme.colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: theme.colors.border,
    padding: theme.spacing.md, marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  cardExpired: { opacity: 0.6 },
  cardHeader:  { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 8 },
  passAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: theme.colors.primary + "22",
    justifyContent: "center", alignItems: "center",
  },
  passAvatarText: { fontSize: 15, fontWeight: "700", color: theme.colors.primary },
  visitorName:    { fontSize: 15, fontWeight: "600", color: theme.colors.textPrimary },
  passTime:       { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  statusChip:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: theme.borderRadius.full },
  statusText:     { fontSize: 11, fontWeight: "600" },
  expiry:         { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8 },
  qrBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, backgroundColor: theme.colors.primary + "15",
    alignSelf: "flex-start",
  },
  qrBtnText: { fontSize: 13, fontWeight: "600", color: theme.colors.primary },

  /* QR Modal */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  qrModalWrap: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24, padding: 24,
    width: "88%", alignItems: "center",
    ...theme.shadow.lg,
  },
  qrModalClose: {
    position: "absolute", top: 14, right: 14,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: "center", alignItems: "center",
  },
  qrModalTitle:  { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary, marginBottom: 16 },
  qrGradCard:    { borderRadius: 18, padding: 20, alignItems: "center", width: "100%", marginBottom: 16 },
  qrContainer:   { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 14 },
  qrGradName:    { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  qrGradHint:    { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  preApproveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: theme.colors.primaryDark,
    borderRadius: 12, paddingVertical: 14, width: "100%",
  },
  preApproveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  /* Form */
  form:        { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  formCard: {
    backgroundColor: theme.colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: theme.colors.border,
    padding: theme.spacing.lg, ...theme.shadow.sm,
  },
  formTitle:    { fontSize: 17, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 4 },
  formSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  fieldLabel:   { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary, marginBottom: 6 },
  input: {
    height: 48, borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: 10, paddingHorizontal: 14, fontSize: 14,
    color: theme.colors.textPrimary, backgroundColor: theme.colors.background,
    marginBottom: 14,
  },

  /* Picker */
  pickerModal: {
    backgroundColor: theme.colors.surface, borderRadius: 20,
    padding: theme.spacing.lg, width: "85%",
    alignItems: "center", ...theme.shadow.lg,
  },
  closeBtn:     { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 10, backgroundColor: theme.colors.primary },
  closeBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
