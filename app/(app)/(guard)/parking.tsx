/**
 * Guard — Parking Management (persisted via community-service API)
 * Guards manage parking slot occupancy in real time.
 */
import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "../../../src/components/common/AppHeader";
import LoadingButton from "../../../src/components/common/LoadingButton";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { listParking, createParkingSlot, updateParkingSlot, deleteParkingSlot, ParkingSlot } from "../../../src/api/community";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { guardTheme as g } from "../../../src/theme/guardTheme";
import { formatRelative } from "../../../src/utils/format";

const SLOT_TYPES = ["CAR", "BIKE", "GUEST"];
const SLOT_TYPE_COLOR: Record<string, string> = { CAR: "#3498DB", BIKE: "#9B59B6", GUEST: "#27AE60" };
const SLOT_TYPE_ICON: Record<string, string> = { CAR: "directions-car", BIKE: "two-wheeler", GUEST: "person" };

function SlotCard({ slot, communityId }: { slot: ParkingSlot; communityId: string }) {
  const qc = useQueryClient();
  const isVacant = slot.status === "VACANT";
  const isOccupied = slot.status === "OCCUPIED";
  const typeColor = SLOT_TYPE_COLOR[slot.slot_type] ?? "#3498DB";

  const { mutate: doUpdate, isPending } = useMutation({
    mutationFn: (patch: Parameters<typeof updateParkingSlot>[2]) =>
      updateParkingSlot(communityId, slot.id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parking", communityId] }),
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: () => deleteParkingSlot(communityId, slot.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parking", communityId] }),
  });

  const [showOccupyModal, setShowOccupyModal] = useState(false);
  const [occupant, setOccupant]   = useState("");
  const [vehicleNum, setVehicleNum] = useState("");

  const handleOccupy = () => {
    doUpdate({ status: "OCCUPIED", occupant: occupant.trim(), vehicleNum: vehicleNum.trim().toUpperCase() });
    setShowOccupyModal(false); setOccupant(""); setVehicleNum("");
    showToast({ type: "success", message: "Slot marked occupied" });
  };

  const handleVacate = () => {
    Alert.alert("Vacate Slot", `Mark slot ${slot.slot_number} as vacant?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Vacate", onPress: () => { doUpdate({ status: "VACANT", occupant: "", vehicleNum: "" }); showToast({ type: "success", message: "Slot vacated" }); } },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Remove Slot", `Remove slot ${slot.slot_number}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => doDelete() },
    ]);
  };

  return (
    <View style={[s.card, !isVacant && s.cardOccupied]}>
      <View style={s.cardHeader}>
        <View style={[s.typeIcon, { backgroundColor: typeColor + "20" }]}>
          <MaterialIcons name={(SLOT_TYPE_ICON[slot.slot_type] ?? "local-parking") as any} size={18} color={typeColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.slotNum}>Slot {slot.slot_number}</Text>
          <Text style={s.slotType}>{slot.slot_type}</Text>
        </View>
        <View style={[s.statusChip, { backgroundColor: isVacant ? g.colors.success + "15" : g.colors.danger + "15", borderColor: isVacant ? g.colors.success + "44" : g.colors.danger + "44" }]}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: isVacant ? g.colors.success : g.colors.danger }}>
            {isVacant ? "Vacant" : "Occupied"}
          </Text>
        </View>
        <TouchableOpacity style={{ padding: 4 }} onPress={handleDelete}>
          <MaterialIcons name="delete-outline" size={16} color={g.colors.textDisabled} />
        </TouchableOpacity>
      </View>

      {isOccupied && (
        <View style={s.occupantRow}>
          <MaterialIcons name="person" size={12} color={g.colors.textSecondary} />
          <Text style={s.occupantText}>{slot.occupant || "—"}</Text>
          {slot.vehicle_num ? (
            <>
              <MaterialIcons name="directions-car" size={12} color={g.colors.textSecondary} style={{ marginLeft: 8 }} />
              <Text style={s.occupantText}>{slot.vehicle_num}</Text>
            </>
          ) : null}
        </View>
      )}

      <View style={s.actionRow}>
        {isVacant ? (
          <TouchableOpacity style={[s.actionBtn, s.occupyBtn]} onPress={() => setShowOccupyModal(true)} disabled={isPending}>
            <MaterialIcons name="directions-car" size={14} color={g.colors.primary} />
            <Text style={[s.actionText, { color: g.colors.primary }]}>Mark Occupied</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.actionBtn, s.vacateBtn]} onPress={handleVacate} disabled={isPending}>
            <MaterialIcons name="check-circle-outline" size={14} color={g.colors.success} />
            <Text style={[s.actionText, { color: g.colors.success }]}>Mark Vacant</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showOccupyModal} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowOccupyModal(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Occupy Slot {slot.slot_number}</Text>
            <Text style={s.fieldLabel}>Resident / Visitor Name</Text>
            <TextInput style={s.input} value={occupant} onChangeText={setOccupant} placeholder="Who is parking here?" placeholderTextColor={g.colors.textDisabled} />
            <Text style={s.fieldLabel}>Vehicle Number (optional)</Text>
            <TextInput style={s.input} value={vehicleNum} onChangeText={setVehicleNum} placeholder="e.g. KA01AB1234" autoCapitalize="characters" placeholderTextColor={g.colors.textDisabled} />
            <LoadingButton title="Confirm" loadingTitle="Saving…" onPress={handleOccupy} isLoading={isPending} style={{ marginTop: g.spacing.lg }} />
            <TouchableOpacity style={s.cancelRow} onPress={() => setShowOccupyModal(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function AddSlotModal({ visible, communityId, onClose }: { visible: boolean; communityId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [slotNumber, setSlotNumber] = useState("");
  const [slotType, setSlotType]     = useState("CAR");

  const { mutate, isPending } = useMutation({
    mutationFn: () => createParkingSlot(communityId, { slotNumber: slotNumber.trim().toUpperCase(), slotType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parking", communityId] });
      showToast({ type: "success", message: "Slot added" });
      setSlotNumber(""); setSlotType("CAR"); onClose();
    },
    onError: () => showToast({ type: "error", message: "Failed to add slot" }),
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>Add Parking Slot</Text>
          <Text style={s.fieldLabel}>Slot Type</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {SLOT_TYPES.map((t) => (
              <TouchableOpacity key={t} style={[s.chip, slotType === t && s.chipActive]} onPress={() => setSlotType(t)}>
                <Text style={[s.chipText, slotType === t && s.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.fieldLabel}>Slot Number *</Text>
          <TextInput style={s.input} value={slotNumber} onChangeText={setSlotNumber} placeholder="e.g. A-01 or P1" autoCapitalize="characters" placeholderTextColor={g.colors.textDisabled} />
          <LoadingButton title="Add Slot" loadingTitle="Adding…" onPress={() => { if (!slotNumber.trim()) { showToast({ type: "error", message: "Slot number required" }); return; } mutate(); }} isLoading={isPending} style={{ marginTop: g.spacing.lg }} />
          <TouchableOpacity style={s.cancelRow} onPress={onClose}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function ParkingScreen() {
  const { user } = useAuthStore();
  const communityId = user?.communityId ?? "";
  const [showAdd, setShowAdd]   = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data: slots = [], isLoading, refetch } = useQuery({
    queryKey: ["parking", communityId],
    queryFn: () => listParking(communityId),
    enabled: !!communityId,
    staleTime: 30_000,
  });

  const vacant   = slots.filter((s) => s.status === "VACANT").length;
  const occupied = slots.filter((s) => s.status === "OCCUPIED").length;
  const filtered = typeFilter ? slots.filter((s) => s.slot_type === typeFilter) : slots;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Parking" gradientColors={["#49225B", "#6E3482", "#7B3F9A"]} />

      <View style={s.countsBar}>
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: g.colors.success }]}>{vacant}</Text>
          <Text style={s.countLabel}>Vacant</Text>
        </View>
        <View style={s.countSep} />
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: g.colors.danger }]}>{occupied}</Text>
          <Text style={s.countLabel}>Occupied</Text>
        </View>
        <View style={s.countSep} />
        <View style={s.countItem}>
          <Text style={[s.countNum, { color: g.colors.textPrimary }]}>{slots.length}</Text>
          <Text style={s.countLabel}>Total</Text>
        </View>
      </View>

      {/* Type filter */}
      <View style={s.filterRow}>
        {[null, ...SLOT_TYPES].map((t) => (
          <TouchableOpacity key={t ?? "all"} style={[s.chip, typeFilter === t && s.chipActive]} onPress={() => setTypeFilter(t)}>
            <Text style={[s.chipText, typeFilter === t && s.chipTextActive]}>{t ?? "All"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? <SkeletonList count={5} /> : (
        <FlatList
          data={filtered} keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={g.colors.primary} />}
          renderItem={({ item }) => <SlotCard slot={item} communityId={communityId} />}
          ListEmptyComponent={<EmptyState emoji="🅿️" title="No parking slots" subtitle="Tap + to add the first slot." />}
          contentContainerStyle={s.listContent}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => setShowAdd(true)}>
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <AddSlotModal visible={showAdd} communityId={communityId} onClose={() => setShowAdd(false)} />
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
  filterRow: { flexDirection: "row", gap: 8, padding: g.spacing.md, backgroundColor: g.colors.surface, borderBottomWidth: 1, borderBottomColor: g.colors.border },
  listContent: { padding: g.spacing.md, paddingBottom: 90 },
  card: { backgroundColor: g.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: g.colors.border, padding: g.spacing.md, marginBottom: g.spacing.sm, ...g.shadow.sm },
  cardOccupied: { borderColor: g.colors.danger + "44" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: g.spacing.sm },
  typeIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  slotNum: { fontSize: g.fontSize.md, fontWeight: g.fontWeight.semibold, color: g.colors.textPrimary },
  slotType: { fontSize: g.fontSize.xs, color: g.colors.textSecondary },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: g.borderRadius.full, borderWidth: 1, marginRight: 6 },
  occupantRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: g.spacing.sm },
  occupantText: { fontSize: 12, color: g.colors.textSecondary },
  actionRow: { flexDirection: "row" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: g.borderRadius.md, borderWidth: 1 },
  occupyBtn: { borderColor: g.colors.primary + "55", backgroundColor: g.colors.primary + "10" },
  vacateBtn: { borderColor: g.colors.success + "55", backgroundColor: g.colors.success + "10" },
  actionText: { fontSize: g.fontSize.sm, fontWeight: "600" },
  fab: { position: "absolute", bottom: 28, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: "#3498DB", justifyContent: "center", alignItems: "center", ...g.shadow.lg },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: g.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: g.spacing.xl },
  sheetTitle: { fontSize: g.fontSize.lg, fontWeight: g.fontWeight.bold, color: g.colors.textPrimary, marginBottom: g.spacing.lg },
  fieldLabel: { fontSize: g.fontSize.sm, fontWeight: "600", color: g.colors.textPrimary, marginBottom: 6, marginTop: g.spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: g.borderRadius.full, borderWidth: 1, borderColor: g.colors.border },
  chipActive: { backgroundColor: g.colors.primary, borderColor: g.colors.primary },
  chipText: { fontSize: 12, color: g.colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  input: { height: 48, borderWidth: 1, borderColor: g.colors.border, borderRadius: g.borderRadius.md, paddingHorizontal: 12, fontSize: g.fontSize.sm, color: g.colors.textPrimary, backgroundColor: g.colors.background },
  cancelRow: { marginTop: g.spacing.md, alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: g.fontSize.sm, color: g.colors.textSecondary },
});
