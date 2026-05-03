/**
 * Resident Visitors — Phase 09
 * Pre-register visitors + show QR passes
 */
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import AppHeader from "../../../src/components/common/AppHeader";
import LoadingButton from "../../../src/components/common/LoadingButton";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { useVisitorPassList, useCreateVisitorPass } from "../../../src/hooks/useVisitors";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatDateTime, formatRelative } from "../../../src/utils/format";
import type { VisitorPass } from "../../../src/types";

type Tab = "REGISTER" | "PASSES";

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

function RegisterForm() {
  const { user } = useAuthStore();
  const { mutate: createPass, isPending } = useCreateVisitorPass();

  const [visitorName, setVisitorName] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

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
        unitId: user.communityId,
        residentId: user.id,
        visitorName: visitorName.trim(),
        expectedAt: new Date(expectedAt).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
      },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Visitor pass created!" });
          setVisitorName("");
          setExpectedAt("");
          setExpiresAt("");
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
        <TextInput
          style={s.input}
          value={expectedAt}
          onChangeText={setExpectedAt}
          placeholder={Platform.OS === "ios" ? "YYYY-MM-DD HH:MM" : "2024-12-31 14:00"}
          placeholderTextColor={theme.colors.textDisabled}
          keyboardType="default"
        />
        <Text style={s.fieldHint}>Format: YYYY-MM-DD HH:MM (24h)</Text>

        <Text style={s.fieldLabel}>Pass Expires At *</Text>
        <TextInput
          style={s.input}
          value={expiresAt}
          onChangeText={setExpiresAt}
          placeholder={Platform.OS === "ios" ? "YYYY-MM-DD HH:MM" : "2024-12-31 23:59"}
          placeholderTextColor={theme.colors.textDisabled}
          keyboardType="default"
        />
        <Text style={s.fieldHint}>Format: YYYY-MM-DD HH:MM (24h)</Text>

        <LoadingButton
          title="Create Visitor Pass"
          loadingTitle="Creating..."
          onPress={handleSubmit}
          isLoading={isPending}
          style={{ marginTop: theme.spacing.lg }}
        />
      </View>
    </ScrollView>
  );
}

export default function ResidentVisitorsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("REGISTER");
  const { data: passes = [], isLoading } = useVisitorPassList();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Visitors" />

      <View style={s.tabRow}>
        {(["REGISTER", "PASSES"] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          const label = tab === "REGISTER" ? "Pre-register" : "My Passes";
          return (
            <TouchableOpacity
              key={tab}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === "REGISTER" ? (
        <RegisterForm />
      ) : isLoading ? (
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
