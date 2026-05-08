/**
 * Admin — Inventory Management (persisted via community-service API)
 */
import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "../../../src/components/common/AppHeader";
import LoadingButton from "../../../src/components/common/LoadingButton";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { listInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, InventoryItem } from "../../../src/api/community";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";

const CATEGORIES = ["Furniture","Equipment","Tools","Consumables","Electrical","Plumbing","Garden","Sports","Other"];
const LOW_STOCK = 3;

function ConditionBadge({ condition }: { condition: string }) {
  const colors: Record<string, string> = { Good: theme.colors.success, Fair: "#F39C12", Poor: theme.colors.danger };
  const color = colors[condition] ?? theme.colors.textSecondary;
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: color + "18", borderWidth: 1, borderColor: color + "44" }}>
      <Text style={{ fontSize: 10, fontWeight: "700", color }}>{condition}</Text>
    </View>
  );
}

function AssetCard({ item, communityId }: { item: InventoryItem; communityId: string }) {
  const qc = useQueryClient();
  const isLow = item.quantity <= LOW_STOCK;

  const { mutate: doUpdate } = useMutation({
    mutationFn: (patch: Partial<{ quantity: number; condition: string }>) =>
      updateInventoryItem(communityId, item.id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", communityId] }),
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: () => deleteInventoryItem(communityId, item.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", communityId] }),
  });

  const handleDelete = () => Alert.alert("Remove Asset", `Remove "${item.name}"?`, [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => doDelete() },
  ]);

  return (
    <View style={[s.card, isLow && s.cardLow]}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={s.assetName}>{item.name}</Text>
            {isLow && (
              <View style={s.lowBadge}>
                <MaterialIcons name="warning" size={10} color="#E74C3C" />
                <Text style={s.lowBadgeText}>Low</Text>
              </View>
            )}
          </View>
          <Text style={s.assetMeta}>{item.category}{item.location ? ` · ${item.location}` : ""}</Text>
        </View>
        <ConditionBadge condition={item.condition} />
      </View>

      <View style={s.qtyRow}>
        <TouchableOpacity style={s.qtyBtn}
          onPress={() => { if (item.quantity > 0) doUpdate({ quantity: item.quantity - 1 }); }}>
          <MaterialIcons name="remove" size={18} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.qtyDisplay}>
          <Text style={[s.qtyNum, isLow && { color: theme.colors.danger }]}>{item.quantity}</Text>
          <Text style={s.qtyUnit}>{item.unit}</Text>
        </View>
        <TouchableOpacity style={s.qtyBtn} onPress={() => doUpdate({ quantity: item.quantity + 1 })}>
          <MaterialIcons name="add" size={18} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
          <MaterialIcons name="delete-outline" size={16} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddAssetModal({ visible, communityId, onClose }: { visible: boolean; communityId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName]         = useState("");
  const [category, setCategory] = useState("Furniture");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit]         = useState("pcs");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("Good");

  const { mutate, isPending } = useMutation({
    mutationFn: () => createInventoryItem(communityId, {
      name: name.trim(), category,
      quantity: parseInt(quantity, 10) || 0,
      unit: unit.trim() || "pcs",
      location: location.trim(),
      condition,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", communityId] });
      showToast({ type: "success", message: "Asset added" });
      setName(""); setQuantity("1"); setUnit("pcs"); setLocation(""); setCondition("Good");
      onClose();
    },
    onError: () => showToast({ type: "error", message: "Failed to add asset" }),
  });

  const handleAdd = () => {
    if (!name.trim()) { showToast({ type: "error", message: "Asset name is required" }); return; }
    mutate();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>Add Asset</Text>
          <Text style={s.fieldLabel}>Category</Text>
          <FlatList horizontal showsHorizontalScrollIndicator={false}
            data={CATEGORIES} keyExtractor={(c) => c}
            renderItem={({ item: c }) => (
              <TouchableOpacity style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)}>
                <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          />
          <Text style={s.fieldLabel}>Asset Name *</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Folding Chair" placeholderTextColor={theme.colors.textDisabled} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Quantity</Text>
              <TextInput style={s.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholderTextColor={theme.colors.textDisabled} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Unit</Text>
              <TextInput style={s.input} value={unit} onChangeText={setUnit} placeholder="pcs/kg/L" placeholderTextColor={theme.colors.textDisabled} />
            </View>
          </View>
          <Text style={s.fieldLabel}>Location</Text>
          <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="e.g. Clubhouse store" placeholderTextColor={theme.colors.textDisabled} />
          <Text style={s.fieldLabel}>Condition</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["Good","Fair","Poor"].map((c) => (
              <TouchableOpacity key={c} style={[s.chip, condition === c && s.chipActive]} onPress={() => setCondition(c)}>
                <Text style={[s.chipText, condition === c && s.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <LoadingButton title="Add Asset" loadingTitle="Adding…" onPress={handleAdd} isLoading={isPending} style={{ marginTop: theme.spacing.lg }} />
          <TouchableOpacity style={s.cancelRow} onPress={onClose}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function AdminInventoryScreen() {
  const { user } = useAuthStore();
  const communityId = user?.communityId ?? "";
  const [showAdd, setShowAdd]   = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ["inventory", communityId],
    queryFn: () => listInventory(communityId),
    enabled: !!communityId,
    staleTime: 60_000,
  });

  const lowCount = items.filter((a) => a.quantity <= LOW_STOCK).length;
  const filtered = catFilter ? items.filter((a) => a.category === catFilter) : items;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Inventory" />

      {lowCount > 0 && (
        <View style={s.alertBanner}>
          <MaterialIcons name="warning" size={16} color="#E74C3C" />
          <Text style={s.alertText}>{lowCount} item{lowCount > 1 ? "s" : ""} at low stock (≤{LOW_STOCK})</Text>
        </View>
      )}

      <FlatList horizontal showsHorizontalScrollIndicator={false}
        data={[null, ...CATEGORIES]} keyExtractor={(c) => c ?? "all"}
        renderItem={({ item: c }) => (
          <TouchableOpacity style={[s.chip, catFilter === c && s.chipActive]} onPress={() => setCatFilter(c)}>
            <Text style={[s.chipText, catFilter === c && s.chipTextActive]}>{c ?? "All"}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ gap: 8, padding: theme.spacing.md }}
        style={{ backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
      />

      {isLoading ? <SkeletonList count={4} /> : (
        <FlatList
          data={filtered} keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => <AssetCard item={item} communityId={communityId} />}
          ListEmptyComponent={<EmptyState emoji="📦" title="No assets tracked" subtitle="Tap + to add your first inventory item." />}
          contentContainerStyle={s.listContent}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => setShowAdd(true)}>
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <AddAssetModal visible={showAdd} communityId={communityId} onClose={() => setShowAdd(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#E74C3C10", borderBottomWidth: 1, borderBottomColor: "#E74C3C44", paddingHorizontal: theme.spacing.md, paddingVertical: 10 },
  alertText: { fontSize: theme.fontSize.xs, color: "#E74C3C", fontWeight: "600" },
  listContent: { padding: theme.spacing.md, paddingBottom: 90 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.shadow.sm },
  cardLow: { borderColor: "#E74C3C44", backgroundColor: "#E74C3C08" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spacing.sm },
  assetName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  assetMeta: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  lowBadge: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "#E74C3C18", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 99 },
  lowBadgeText: { fontSize: 9, fontWeight: "800", color: "#E74C3C" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, justifyContent: "center", alignItems: "center" },
  qtyDisplay: { alignItems: "center", minWidth: 50 },
  qtyNum: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  qtyUnit: { fontSize: 10, color: theme.colors.textSecondary },
  deleteBtn: { marginLeft: "auto" as any, padding: 6 },
  fab: { position: "absolute", bottom: 28, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center", ...theme.shadow.lg },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.xl, maxHeight: "90%" },
  sheetTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: "600", color: theme.colors.textPrimary, marginBottom: 6, marginTop: theme.spacing.md },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, backgroundColor: theme.colors.background },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  cancelRow: { marginTop: theme.spacing.md, alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
