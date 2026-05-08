/**
 * Guard — Parcel Management
 * Tracks courier deliveries (Swiggy, Amazon, Zomato, etc.) at the gate.
 * Uses the visitor API with type=COURIER. Guard logs parcel in, resident collects, guard marks checkout.
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../src/components/common/AppHeader";
import EmptyState from "../../../src/components/common/EmptyState";
import LoadingButton from "../../../src/components/common/LoadingButton";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import StatusBadge from "../../../src/components/common/StatusBadge";
import { useVisitorList, useCreateVisitor, useCheckinVisitor, useCheckoutVisitor } from "../../../src/hooks/useVisitors";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatRelative } from "../../../src/utils/format";
import type { Visitor } from "../../../src/types";

const DELIVERY_PARTNERS = ["Amazon", "Flipkart", "Swiggy", "Zomato", "Dunzo", "BigBasket", "Zepto", "Blinkit", "Other"];

function ParcelCard({ item }: { item: Visitor }) {
  const { mutate: checkin,  isPending: checkingIn  } = useCheckinVisitor();
  const { mutate: checkout, isPending: checkingOut } = useCheckoutVisitor();
  const busy = checkingIn || checkingOut;

  const isWaiting    = item.status === "PENDING_APPROVAL" || item.status === "APPROVED";
  const isCollected  = item.status === "CHECKED_OUT";
  const isAtGate     = item.status === "CHECKED_IN";

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.nameRow}>
          <View style={[s.parcelIcon, { backgroundColor: "#F39C12" + "20" }]}>
            <MaterialIcons name="inventory" size={20} color="#F39C12" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.parcelName}>{item.visitor_name}</Text>
            {item.visitor_phone && item.visitor_phone !== "0000000000" ? (
              <Text style={s.parcelPhone}>{item.visitor_phone}</Text>
            ) : null}
          </View>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>

      <View style={s.metaRow}>
        <MaterialIcons name="access-time" size={12} color={theme.colors.textSecondary} />
        <Text style={s.timeText}>Arrived {formatRelative(item.created_at)}</Text>
      </View>

      {isWaiting && (
        <TouchableOpacity
          style={[s.actionBtn, s.inBtn]}
          onPress={() => checkin({ id: item.id }, { onSuccess: () => showToast({ type: "success", message: "Parcel marked at gate" }) })}
          disabled={busy}
        >
          <MaterialIcons name="move-to-inbox" size={16} color={theme.colors.primary} />
          <Text style={[s.actionText, { color: theme.colors.primary }]}>Mark at Gate</Text>
        </TouchableOpacity>
      )}

      {isAtGate && (
        <TouchableOpacity
          style={[s.actionBtn, s.outBtn]}
          onPress={() => checkout({ id: item.id }, { onSuccess: () => showToast({ type: "success", message: "Parcel collected ✓" }) })}
          disabled={busy}
        >
          <MaterialIcons name="check-circle" size={16} color={theme.colors.success} />
          <Text style={[s.actionText, { color: theme.colors.success }]}>Mark Collected</Text>
        </TouchableOpacity>
      )}

      {isCollected && (
        <View style={s.collectedRow}>
          <MaterialIcons name="check-circle" size={14} color={theme.colors.success} />
          <Text style={s.collectedText}>Collected by resident</Text>
        </View>
      )}
    </View>
  );
}

function AddParcelModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  const { mutate: createVisitor, isPending } = useCreateVisitor();
  const [partner, setPartner] = useState("Amazon");
  const [recipient, setRecipient] = useState("");
  const [customPartner, setCustomPartner] = useState("");

  const handleAdd = () => {
    if (!recipient.trim()) {
      showToast({ type: "error", message: "Recipient / flat number required" });
      return;
    }
    if (!user) return;
    const partnerName = partner === "Other" ? customPartner || "Other" : partner;
    createVisitor(
      {
        tenantId:     user.tenantId,
        communityId:  user.communityId,
        unitId:       user.communityId,
        visitorName:  `${partnerName} — ${recipient.trim()}`,
        visitorPhone: "0000000000",
        visitorType:  "COURIER",
      },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Parcel logged" });
          setRecipient(""); setCustomPartner(""); setPartner("Amazon");
          onClose();
        },
        onError: () => showToast({ type: "error", message: "Failed to log parcel" }),
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>Log Parcel / Delivery</Text>

          <Text style={s.fieldLabel}>Delivery Partner</Text>
          <View style={s.partnerGrid}>
            {DELIVERY_PARTNERS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[s.partnerChip, partner === p && s.partnerChipActive]}
                onPress={() => setPartner(p)}
              >
                <Text style={[s.partnerText, partner === p && s.partnerTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {partner === "Other" && (
            <TextInput
              style={[s.input, { marginTop: 8 }]}
              value={customPartner}
              onChangeText={setCustomPartner}
              placeholder="Enter partner name"
              placeholderTextColor={theme.colors.textDisabled}
            />
          )}

          <Text style={s.fieldLabel}>Recipient / Flat Number *</Text>
          <TextInput
            style={s.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="e.g. Rahul Kumar / A-101"
            placeholderTextColor={theme.colors.textDisabled}
          />

          <LoadingButton title="Log Parcel" loadingTitle="Logging…" onPress={handleAdd} isLoading={isPending} style={{ marginTop: theme.spacing.lg }} />
          <TouchableOpacity style={s.cancelRow} onPress={onClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function ParcelsScreen() {
  const [showAdd, setShowAdd] = useState(false);
  const { data: all = [], isLoading, refetch } = useVisitorList(undefined);

  // Filter to courier type only, sorted newest first
  const parcels = all
    .filter((v) => v.visitor_type === "COURIER")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const waiting   = parcels.filter((p) => ["PENDING_APPROVAL", "APPROVED", "CHECKED_IN"].includes(p.status)).length;
  const collected = parcels.filter((p) => p.status === "CHECKED_OUT").length;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Parcels" />

      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: theme.colors.warning }]}>{waiting}</Text>
          <Text style={s.summaryLabel}>Waiting</Text>
        </View>
        <View style={s.summarySep} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: theme.colors.success }]}>{collected}</Text>
          <Text style={s.summaryLabel}>Collected</Text>
        </View>
        <View style={s.summarySep} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: theme.colors.textPrimary }]}>{parcels.length}</Text>
          <Text style={s.summaryLabel}>Total</Text>
        </View>
      </View>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <FlatList
          data={parcels}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => <ParcelCard item={item} />}
          ListEmptyComponent={
            <EmptyState emoji="📦" title="No parcels today" subtitle="Tap + to log a new delivery." />
          }
          contentContainerStyle={s.listContent}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => setShowAdd(true)}>
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <AddParcelModal visible={showAdd} onClose={() => setShowAdd(false)} />
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
  listContent: { padding: theme.spacing.md, paddingBottom: 90 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.shadow.sm },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spacing.sm },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  parcelIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  parcelName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  parcelPhone: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: theme.spacing.sm },
  timeText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: theme.borderRadius.md, borderWidth: 1 },
  inBtn: { borderColor: theme.colors.primary + "55", backgroundColor: theme.colors.primary + "10" },
  outBtn: { borderColor: theme.colors.success + "55", backgroundColor: theme.colors.success + "10" },
  actionText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
  collectedRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  collectedText: { fontSize: theme.fontSize.xs, color: theme.colors.success },
  fab: { position: "absolute", bottom: 28, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: "#F39C12", justifyContent: "center", alignItems: "center", ...theme.shadow.lg },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.xl },
  sheetTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary, marginBottom: 8, marginTop: theme.spacing.md },
  partnerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  partnerChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  partnerChipActive: { backgroundColor: "#F39C12", borderColor: "#F39C12" },
  partnerText: { fontSize: theme.fontSize.xs, fontWeight: "600", color: theme.colors.textSecondary },
  partnerTextActive: { color: "#FFFFFF" },
  input: { height: 48, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, backgroundColor: theme.colors.background },
  cancelRow: { marginTop: theme.spacing.md, alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
