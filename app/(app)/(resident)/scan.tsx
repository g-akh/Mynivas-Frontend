/**
 * Resident Scan — Gate pass QR code display
 */
import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { useAuthStore } from "../../../src/store/auth.store";
import { theme } from "../../../src/theme";

export default function ScanScreen() {
  const { user } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  // Encode only stable identity fields — no timestamp so the QR is the same
  // every time and the guard can scan it reliably.
  const qrValue = JSON.stringify({
    type:       "GATE_PASS",
    residentId: user?.id       ?? "unknown",
    unitId:     user?.unitId   ?? "unknown",
    tenantId:   user?.tenantId ?? "unknown",
  });

  const unitLabel = user?.unitId ?? "—";
  const userName  = user?.name ?? "Resident";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={["#0D2766", "#1565C0"]}
        style={s.header}
      >
        <Text style={s.headerTitle}>My Gate Pass</Text>
        <Text style={s.headerSub}>Show this at the entry gate</Text>
      </LinearGradient>

      <View style={s.content}>
        {/* Gate Pass Card */}
        <LinearGradient
          colors={["#1565C0", "#0D2766"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.passCard}
        >
          <View style={s.qrWrap}>
            <QRCode
              value={qrValue}
              size={180}
              color={theme.colors.primaryDark}
              backgroundColor="#FFFFFF"
            />
          </View>
          <Text style={s.passUnit}>{unitLabel} · {userName}</Text>
          <Text style={s.passHint}>Show this at the gate</Text>
        </LinearGradient>

        {/* Pre-approve CTA */}
        <TouchableOpacity
          style={s.preApproveBtn}
          onPress={() => setShowPass(true)}
        >
          <MaterialIcons name="flash-on" size={18} color="#FFFFFF" />
          <Text style={s.preApproveBtnText}>Pre-approve a visitor</Text>
        </TouchableOpacity>

        {/* Info cards */}
        <View style={s.infoRow}>
          <View style={s.infoCard}>
            <MaterialIcons name="qr-code-scanner" size={28} color={theme.colors.primary} />
            <Text style={s.infoTitle}>Scan to Enter</Text>
            <Text style={s.infoDesc}>Show your QR code to the guard for instant access</Text>
          </View>
          <View style={s.infoCard}>
            <MaterialIcons name="people" size={28} color={theme.colors.secondary} />
            <Text style={s.infoTitle}>Pre-register</Text>
            <Text style={s.infoDesc}>Register visitors in advance from the Visitors tab</Text>
          </View>
        </View>
      </View>

      {/* Pre-approve modal placeholder */}
      <Modal visible={showPass} transparent animationType="slide" onRequestClose={() => setShowPass(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Pre-approve a Visitor</Text>
            <Text style={s.modalDesc}>Go to the Visitors tab to register and pre-approve your guest.</Text>
            <TouchableOpacity style={s.modalBtn} onPress={() => setShowPass(false)}>
              <Text style={s.modalBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.colors.background },

  header:  { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  headerSub:   { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 },

  content: { flex: 1, padding: 20, gap: 16 },

  passCard: {
    borderRadius: 20, padding: 24,
    alignItems: "center",
    ...theme.shadow.lg,
  },
  qrWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16, padding: 16,
    marginBottom: 16,
  },
  passUnit: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  passHint: { fontSize: 13, color: "rgba(255,255,255,0.75)" },

  preApproveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: theme.colors.primaryDark,
    borderRadius: 14, paddingVertical: 16,
    ...theme.shadow.md,
  },
  preApproveBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  infoRow: { flexDirection: "row", gap: 12 },
  infoCard: {
    flex: 1, backgroundColor: theme.colors.surface,
    borderRadius: 14, padding: 14, alignItems: "center",
    ...theme.shadow.sm,
  },
  infoTitle: { fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 8, marginBottom: 4, textAlign: "center" },
  infoDesc:  { fontSize: 12, color: theme.colors.textSecondary, textAlign: "center", lineHeight: 17 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, alignItems: "center",
    ...theme.shadow.lg,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 8 },
  modalDesc:  { fontSize: 14, color: theme.colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  modalBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40,
  },
  modalBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
