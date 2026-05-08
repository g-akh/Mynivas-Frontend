/**
 * Resident Visitors — Phase 09
 * Pre-register visitors + show QR passes
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
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import AppHeader from "../../../src/components/common/AppHeader";
import LoadingButton from "../../../src/components/common/LoadingButton";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { useVisitorPassList, useCreateVisitorPass, useVisitorList } from "../../../src/hooks/useVisitors";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatDateTime, formatRelative } from "../../../src/utils/format";
import type { VisitorPass } from "../../../src/types";

type Tab = "REGISTER" | "PASSES" | "HISTORY";

function PassCard({ item }: { item: VisitorPass }) {
  const [showQR, setShowQR] = useState(false);
  const isExpired = new Date(item.expires_at) < new Date();

  return (
    <View style={[s.card, isExpired && s.cardExpired]}>
      <View style={s.cardHeader}>
        <View>
          <Text style={s.visitorName}>{item.visitor_name}</Text>
          <Text style={s.passTime}>Expected: {formatDateTime(item.expected_at)}</Text>
        </View>
        <View style={[s.statusChip, { backgroundColor: isExpired ? theme.colors.textDisabled + "20" : theme.colors.success + "20" }]}>
          <Text style={[s.statusText, { color: isExpired ? theme.colors.textDisabled : theme.colors.success }]}>
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
          <View style={s.qrModal}>
            <Text style={s.qrModalTitle}>{item.visitor_name}</Text>
            <Text style={s.qrModalSubtitle}>Visitor Pass QR Code</Text>
            <View style={s.qrContainer}>
              <QRCode value={item.id} size={220} color={theme.colors.textPrimary} />
            </View>
            <Text style={s.qrExpiry}>Valid until: {formatDateTime(item.expires_at)}</Text>
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowQR(false)}>
              <Text style={s.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function formatDateForDisplay(date: Date | null): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}`;
}

type PickerField = "expectedAt" | "expiresAt";
type PickerMode = "date" | "time";

function RegisterForm() {
  const { user } = useAuthStore();
  const { mutate: createPass, isPending } = useCreateVisitorPass();

  const [visitorName, setVisitorName] = useState("");
  const [expectedAt, setExpectedAt] = useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const [pickerField, setPickerField] = useState<PickerField | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>("date");
  const [tempDate, setTempDate] = useState(new Date());

  const openPicker = useCallback((field: PickerField) => {
    const current = field === "expectedAt" ? expectedAt : expiresAt;
    setTempDate(current ?? new Date());
    setPickerField(field);
    setPickerMode("date");
  }, [expectedAt, expiresAt]);

  const onPickerChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (_event.type === "dismissed") {
      setPickerField(null);
      return;
    }
    if (!selectedDate || !pickerField) return;

    if (pickerMode === "date") {
      setTempDate(selectedDate);
      if (Platform.OS === "android") {
        setPickerMode("time");
      } else {
        const setter = pickerField === "expectedAt" ? setExpectedAt : setExpiresAt;
        setter(selectedDate);
      }
    } else {
      const combined = new Date(tempDate);
      combined.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      const setter = pickerField === "expectedAt" ? setExpectedAt : setExpiresAt;
      setter(combined);
      setPickerField(null);
    }
  }, [pickerField, pickerMode, tempDate]);

  const handleSubmit = () => {
    if (!visitorName.trim()) {
      showToast({ type: "error", message: "Visitor name is required" });
      return;
    }
    if (!expectedAt) {
      showToast({ type: "error", message: "Expected arrival time is required" });
      return;
    }
    if (!expiresAt) {
      showToast({ type: "error", message: "Expiry time is required" });
      return;
    }
    if (!user) return;

    createPass(
      {
        tenantId: user.tenantId,
        unitId: user.unitId ?? user.communityId,
        residentId: user.id,
        visitorName: visitorName.trim(),
        expectedAt: expectedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Visitor pass created!" });
          setVisitorName("");
          setExpectedAt(null);
          setExpiresAt(null);
        },
        onError: () => showToast({ type: "error", message: "Failed to create visitor pass" }),
      }
    );
  };

  return (
    <ScrollView contentContainerStyle={s.form}>
      <View style={s.formCard}>
        <Text style={s.formTitle}>Register a Visitor</Text>
        <Text style={s.formSubtitle}>
          Create a pass so your visitor can enter the community
        </Text>

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
                  onChange={(_e, d) => {
                    if (d) setTempDate(d);
                  }}
                />
                <TouchableOpacity
                  style={s.closeBtn}
                  onPress={() => {
                    const setter = pickerField === "expectedAt" ? setExpectedAt : setExpiresAt;
                    setter(tempDate);
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

function VisitorHistoryCard({ item }: { item: any }) {
  const statusColor: Record<string, string> = {
    PENDING_APPROVAL: "#F39C12",
    APPROVED: "#27AE60",
    CHECKED_IN: "#3498DB",
    CHECKED_OUT: "#7F8C8D",
    REJECTED: "#E74C3C",
  };
  const color = statusColor[item.status] ?? theme.colors.textSecondary;
  return (
    <View style={s.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.visitorName}>{item.visitor_name}</Text>
          {item.visitor_phone ? <Text style={s.passTime}>{item.visitor_phone}</Text> : null}
        </View>
        <View style={[s.statusChip, { backgroundColor: color + "20" }]}>
          <Text style={[s.statusText, { color }]}>{item.status?.replace(/_/g, " ")}</Text>
        </View>
      </View>
      <Text style={s.expiry}>Type: {item.visitor_type}  •  {formatRelative(item.created_at)}</Text>
      {item.entry_at && <Text style={[s.expiry, { color: "#27AE60" }]}>Entry: {formatDateTime(item.entry_at)}</Text>}
      {item.exit_at  && <Text style={[s.expiry, { color: "#7F8C8D" }]}>Exit: {formatDateTime(item.exit_at)}</Text>}
    </View>
  );
}

export default function ResidentVisitorsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("REGISTER");
  const { data: passes = [], isLoading: passesLoading } = useVisitorPassList();
  const { data: history = [], isLoading: historyLoading, refetch: refetchHistory } = useVisitorList(undefined);

  const TABS: { key: Tab; label: string }[] = [
    { key: "REGISTER", label: "Pre-register" },
    { key: "PASSES",   label: "My Passes"    },
    { key: "HISTORY",  label: "History"      },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Visitors" />

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

      {activeTab === "REGISTER" ? (
        <RegisterForm />
      ) : activeTab === "PASSES" ? (
        passesLoading ? (
          <SkeletonList count={3} />
        ) : (
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
        <FlatList
          data={[...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VisitorHistoryCard item={item} />}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetchHistory} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <EmptyState emoji="📋" title="No visitor history" subtitle="Your visitor activity will appear here." />
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
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: theme.colors.primary },
  tabText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },
  listContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  form: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadow.sm,
  },
  formTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: 4 },
  formSubtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary, marginBottom: 6 },
  fieldHint: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled, marginTop: 3, marginBottom: theme.spacing.md },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  cardExpired: { opacity: 0.6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  visitorName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  passTime: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  statusChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: theme.borderRadius.full },
  statusText: { fontSize: 11, fontWeight: theme.fontWeight.semibold },
  expiry: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  qrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + "15",
    alignSelf: "flex-start",
  },
  qrBtnText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.primary },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" },
  qrModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: "center",
    width: "80%",
    ...theme.shadow.lg,
  },
  qrModalTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: 4 },
  qrModalSubtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  pickerModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: "85%",
    alignItems: "center",
    ...theme.shadow.lg,
  },
  qrContainer: { padding: 16, backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  qrExpiry: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md },
  closeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  closeBtnText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: "#FFFFFF" },
});
