/**
 * FM — Amenity Management + Booking Approvals
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, ScrollView, TextInput, Switch
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "../../../../src/components/common/AppHeader";
import StatusBadge from "../../../../src/components/common/StatusBadge";
import LoadingButton from "../../../../src/components/common/LoadingButton";
import EmptyState from "../../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../../src/components/common/SkeletonLoader";
import ConfirmDialog from "../../../../src/components/common/ConfirmDialog";
import { useAmenityList, useBookingList, useApproveBooking, useRejectBooking } from "../../../../src/hooks/useAmenities";
import { createAmenity } from "../../../../src/api/amenities";
import { useAuthStore } from "../../../../src/store/auth.store";
import { showToast } from "../../../../src/store/ui.store";
import { getErrorMessage } from "../../../../src/api/client";
import { formatDate } from "../../../../src/utils/format";
import { theme } from "../../../../src/theme";
import type { Amenity, Booking } from "../../../../src/types";

type Tab = "amenities" | "approvals";

function AmenityItem({ item }: { item: Amenity }) {
  return (
    <View style={s.card}>
      <View style={{ flex: 1 }}>
        <Text style={s.amenityName}>{item.name}</Text>
        {item.location ? <Text style={s.amenityLoc}>📍 {item.location}</Text> : null}
        <Text style={s.amenityMeta}>Capacity: {item.capacity} · {item.slots?.length ?? 0} slots</Text>
      </View>
      {item.requires_approval ? (
        <View style={s.approvalTag}>
          <Text style={s.approvalTagText}>Approval</Text>
        </View>
      ) : (
        <View style={s.instantTag}>
          <Text style={s.instantTagText}>Instant</Text>
        </View>
      )}
    </View>
  );
}

function BookingApprovalCard({ item }: { item: Booking }) {
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const { mutate: approve, isPending: approving } = useApproveBooking();
  const { mutate: reject, isPending: rejecting } = useRejectBooking();

  return (
    <View style={s.bookCard}>
      <View style={s.bookHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.bookTitle}>Booking Request</Text>
          <Text style={s.bookMeta}>Date: {formatDate(item.date)}</Text>
          <Text style={s.bookMeta}>Unit: {item.unit_id}</Text>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>
      {item.notes ? <Text style={s.bookNotes}>"{item.notes}"</Text> : null}
      {item.status === "PENDING" && (
        <View style={s.bookActions}>
          <TouchableOpacity
            style={s.rejectBtn}
            onPress={() => setRejectVisible(true)}
            disabled={rejecting}
          >
            <MaterialIcons name="close" size={16} color={theme.colors.danger} />
            <Text style={s.rejectText}>Reject</Text>
          </TouchableOpacity>
          <LoadingButton
            title="Approve"
            onPress={() => approve({ id: item.id }, {
              onSuccess: () => showToast({ type: "success", message: "Booking approved!" }),
              onError: (err) => showToast({ type: "error", message: getErrorMessage(err) }),
            })}
            isLoading={approving}
            style={s.approveBtn}
          />
        </View>
      )}
      <Modal visible={rejectVisible} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.rejectModal}>
            <Text style={s.rejectModalTitle}>Reject Booking</Text>
            <Text style={s.rejectModalSub}>Provide a reason for rejection</Text>
            <TextInput
              style={s.rejectInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason for rejection..."
              placeholderTextColor={theme.colors.textDisabled}
              multiline
            />
            <View style={s.rejectModalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setRejectVisible(false)}>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: "500" }}>Cancel</Text>
              </TouchableOpacity>
              <LoadingButton
                title="Reject"
                variant="danger"
                onPress={() => reject({ id: item.id, reason: rejectReason }, {
                  onSuccess: () => { setRejectVisible(false); showToast({ type: "info", message: "Booking rejected." }); },
                  onError: (err) => showToast({ type: "error", message: getErrorMessage(err) }),
                })}
                isLoading={rejecting}
                disabled={!rejectReason.trim()}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function NewAmenityModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [requiresApproval, setRequiresApproval] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => createAmenity({ communityId: user!.communityId, name, location: location || undefined, capacity: Number(capacity), requiresApproval }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["amenities"] });
      showToast({ type: "success", message: "Amenity created!" });
      setName(""); setLocation(""); setCapacity("1"); setRequiresApproval(false);
      onClose();
    },
    onError: (err) => showToast({ type: "error", message: getErrorMessage(err) }),
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={s.modalHdr}>
          <Text style={s.modalTitle}>Add Amenity</Text>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color={theme.colors.textPrimary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={s.fieldLabel}>Name *</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Swimming Pool" placeholderTextColor={theme.colors.textDisabled} />
          <Text style={s.fieldLabel}>Location</Text>
          <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="e.g. Block A, Ground Floor" placeholderTextColor={theme.colors.textDisabled} />
          <Text style={s.fieldLabel}>Capacity *</Text>
          <TextInput style={s.input} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" placeholder="1" placeholderTextColor={theme.colors.textDisabled} />
          <View style={s.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Requires Approval</Text>
              <Text style={s.switchSub}>Bookings need FM approval before confirmation</Text>
            </View>
            <Switch value={requiresApproval} onValueChange={setRequiresApproval} trackColor={{ true: theme.colors.primary }} />
          </View>
          <LoadingButton title="Create Amenity" loadingTitle="Creating…" onPress={() => mutate()} isLoading={isPending} disabled={!name.trim() || Number(capacity) < 1} style={{ marginTop: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function FMAmenitiesScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("amenities");
  const [showNew, setShowNew] = useState(false);

  const { data: amenities = [], isLoading: aLoading, refetch: aRefetch } = useAmenityList(user?.communityId ?? "");
  const { data: bookings = [], isLoading: bLoading, refetch: bRefetch } = useBookingList({ status: "PENDING" });

  const pendingCount = bookings.filter(b => b.status === "PENDING").length;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader
        title="Amenities"
        showBack
        rightAction={{ icon: "add", onPress: () => setShowNew(true) }}
      />

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, activeTab === "amenities" && s.tabActive]} onPress={() => setActiveTab("amenities")}>
          <Text style={[s.tabText, activeTab === "amenities" && s.tabTextActive]}>Amenities</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === "approvals" && s.tabActive]} onPress={() => setActiveTab("approvals")}>
          <Text style={[s.tabText, activeTab === "approvals" && s.tabTextActive]}>Pending Approvals</Text>
          {pendingCount > 0 && <View style={s.badge}><Text style={s.badgeText}>{pendingCount}</Text></View>}
        </TouchableOpacity>
      </View>

      {activeTab === "amenities" ? (
        aLoading ? <SkeletonList /> : (
          <FlatList
            data={amenities}
            keyExtractor={a => a.id}
            renderItem={({ item }) => <AmenityItem item={item} />}
            refreshControl={<RefreshControl refreshing={false} onRefresh={aRefetch} tintColor={theme.colors.primary} />}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            ListEmptyComponent={<EmptyState emoji="🏊" title="No amenities yet" subtitle="Tap + to add the first amenity" actionLabel="Add Amenity" onAction={() => setShowNew(true)} />}
          />
        )
      ) : (
        bLoading ? <SkeletonList /> : (
          <FlatList
            data={bookings.filter(b => b.status === "PENDING")}
            keyExtractor={b => b.id}
            renderItem={({ item }) => <BookingApprovalCard item={item} />}
            refreshControl={<RefreshControl refreshing={false} onRefresh={bRefetch} tintColor={theme.colors.primary} />}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            ListEmptyComponent={<EmptyState emoji="✅" title="No pending approvals" subtitle="All booking requests have been handled" />}
          />
        )
      )}

      <NewAmenityModal visible={showNew} onClose={() => setShowNew(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
  tab: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 12, gap: 6 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: "500" },
  tabTextActive: { color: theme.colors.primary, fontWeight: "700" },
  badge: { backgroundColor: theme.colors.danger, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow.sm },
  amenityName: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 3 },
  amenityLoc: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 2 },
  amenityMeta: { fontSize: 11, color: theme.colors.textDisabled },
  approvalTag: { backgroundColor: theme.colors.warning + "20", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.warning + "44" },
  approvalTagText: { fontSize: 11, color: theme.colors.warning, fontWeight: "600" },
  instantTag: { backgroundColor: theme.colors.success + "20", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.success + "44" },
  instantTagText: { fontSize: 11, color: theme.colors.success, fontWeight: "600" },
  bookCard: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow.sm },
  bookHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  bookTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 4 },
  bookMeta: { fontSize: 12, color: theme.colors.textSecondary },
  bookNotes: { fontSize: 12, color: theme.colors.textSecondary, fontStyle: "italic", marginBottom: 10 },
  bookActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  rejectBtn: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1, height: 40, justifyContent: "center", borderRadius: 8, borderWidth: 1.5, borderColor: theme.colors.danger },
  rejectText: { fontSize: 13, color: theme.colors.danger, fontWeight: "600" },
  approveBtn: { flex: 2, height: 40 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  rejectModal: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, margin: 24, width: "88%" },
  rejectModalTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 4 },
  rejectModalSub: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 16 },
  rejectInput: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 8, padding: 12, minHeight: 80, fontSize: 14, color: theme.colors.textPrimary, textAlignVertical: "top", marginBottom: 16 },
  rejectModalActions: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, height: 44, justifyContent: "center", alignItems: "center", borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  modalHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modalTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.textPrimary },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: theme.colors.textPrimary, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface, marginBottom: 16 },
  switchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 4 },
  switchSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
});
