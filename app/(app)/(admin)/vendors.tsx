/**
 * Admin — Vendor Control
 * Add, manage, rate, and assign work to vendors.
 */
import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, Linking, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../src/components/common/AppHeader";
import LoadingButton from "../../../src/components/common/LoadingButton";
import EmptyState from "../../../src/components/common/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listVendors, createVendor, updateVendor, deleteVendor, Vendor } from "../../../src/api/community";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";

const CATEGORIES = ["Plumbing", "Electrical", "Carpentry", "Cleaning", "Painting", "Security", "Landscaping", "IT/CCTV", "Lifts", "Pest Control", "Other"];
const CATEGORY_ICONS: Record<string, string> = {
  Plumbing: "water-damage", Electrical: "electrical-services", Carpentry: "carpenter",
  Cleaning: "cleaning-services", Painting: "format-paint", Security: "security",
  Landscaping: "park", "IT/CCTV": "videocam", Lifts: "elevator",
  "Pest Control": "bug-report", Other: "handyman",
};

// Vendor type is imported from src/api/community

function StarRating({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onRate?.(star)} disabled={!onRate}>
          <MaterialIcons
            name={star <= rating ? "star" : "star-border"}
            size={16}
            color={star <= rating ? "#F39C12" : theme.colors.textDisabled}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function VendorCard({
  vendor,
  onRate,
  onToggleStatus,
  onDelete,
}: {
  vendor: Vendor;
  onRate: (id: string, r: number) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const icon = CATEGORY_ICONS[vendor.category] ?? "handyman";
  const isActive = vendor.status === "Active";

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.avatar, { backgroundColor: isActive ? theme.colors.primary + "20" : theme.colors.textDisabled + "20" }]}>
          <MaterialIcons name={icon as any} size={20} color={isActive ? theme.colors.primary : theme.colors.textDisabled} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.vendorName}>{vendor.name}</Text>
          <Text style={s.vendorCat}>{vendor.category}</Text>
        </View>
        <View style={[s.statusChip, { backgroundColor: isActive ? theme.colors.success + "15" : theme.colors.danger + "15", borderColor: isActive ? theme.colors.success + "44" : theme.colors.danger + "44" }]}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: isActive ? theme.colors.success : theme.colors.danger }}>{vendor.status}</Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <StarRating rating={vendor.rating} onRate={(r) => onRate(vendor.id, r)} />
        <Text style={s.jobsText}>{vendor.totalJobs} jobs</Text>
      </View>

      {vendor.notes ? <Text style={s.notes}>{vendor.notes}</Text> : null}

      <View style={s.actionRow}>
        {vendor.phone ? (
          <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL(`tel:${vendor.phone}`)}>
            <MaterialIcons name="call" size={14} color={theme.colors.primary} />
            <Text style={[s.contactText, { color: theme.colors.primary }]}>{vendor.phone}</Text>
          </TouchableOpacity>
        ) : null}
        <View style={s.rightActions}>
          <TouchableOpacity style={s.iconBtn} onPress={() => onToggleStatus(vendor.id)}>
            <MaterialIcons name={isActive ? "block" : "check-circle"} size={18} color={isActive ? theme.colors.danger : theme.colors.success} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => onDelete(vendor.id)}>
            <MaterialIcons name="delete-outline" size={18} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function AddVendorModal({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (v: Omit<Vendor, "id" | "rating" | "totalJobs">) => void }) {
  const [name, setName]         = useState("");
  const [category, setCategory] = useState("Plumbing");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [notes, setNotes]       = useState("");

  const handleAdd = () => {
    if (!name.trim()) { showToast({ type: "error", message: "Vendor name is required" }); return; }
    onAdd({ name: name.trim(), category, phone: phone.trim(), email: email.trim(), notes: notes.trim(), status: "Active" });
    setName(""); setPhone(""); setEmail(""); setNotes(""); setCategory("Plumbing");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>Add Vendor</Text>
          <Text style={s.fieldLabel}>Category</Text>
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(c) => c}
            renderItem={({ item: c }) => (
              <TouchableOpacity style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)}>
                <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          />
          <Text style={s.fieldLabel}>Vendor / Company Name *</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Raju Plumbing Services" placeholderTextColor={theme.colors.textDisabled} />
          <Text style={s.fieldLabel}>Phone</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="+919876543210" keyboardType="phone-pad" placeholderTextColor={theme.colors.textDisabled} />
          <Text style={s.fieldLabel}>Email (optional)</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="vendor@email.com" keyboardType="email-address" placeholderTextColor={theme.colors.textDisabled} />
          <Text style={s.fieldLabel}>Notes</Text>
          <TextInput style={[s.input, { height: 64 }]} value={notes} onChangeText={setNotes} placeholder="Rates, specialisation, availability…" multiline placeholderTextColor={theme.colors.textDisabled} />
          <LoadingButton title="Add Vendor" loadingTitle="Adding…" onPress={handleAdd} isLoading={false} style={{ marginTop: theme.spacing.lg }} />
          <TouchableOpacity style={s.cancelRow} onPress={onClose}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function AdminVendorsScreen() {
  const { user } = useAuthStore();
  const communityId = user?.communityId ?? "";
  const qc = useQueryClient();
  const [showAdd, setShowAdd]   = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [newName, setNewName]   = useState("");
  const [newCat, setNewCat]     = useState("Plumbing");
  const [newPhone, setNewPhone] = useState("");

  const { data: vendors = [], isLoading, refetch } = useQuery({
    queryKey: ["vendors", communityId],
    queryFn: () => listVendors(communityId),
    enabled: !!communityId,
    staleTime: 30_000,
  });

  const { mutate: doCreate, isPending: creating } = useMutation({
    mutationFn: () => createVendor(communityId, { name: newName.trim(), category: newCat, phone: newPhone.trim() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vendors", communityId] }); showToast({ type: "success", message: "Vendor added" }); setShowAdd(false); setNewName(""); setNewPhone(""); },
    onError: () => showToast({ type: "error", message: "Failed" }),
  });

  const { mutate: doUpdate } = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateVendor>[2] }) => updateVendor(communityId, id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors", communityId] }),
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: (id: string) => deleteVendor(communityId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors", communityId] }),
  });

  const handleRate = (id: string, rating: number) => { doUpdate({ id, patch: { rating } }); showToast({ type: "success", message: `Rated ${rating} ⭐` }); };
  const handleToggle = (v: Vendor) => doUpdate({ id: v.id, patch: { status: v.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } });
  const handleDelete = (id: string) => Alert.alert("Remove Vendor", "Remove this vendor?", [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => doDelete(id) },
  ]);

  const handleAdd = () => {
    if (!newName.trim()) { showToast({ type: "error", message: "Name required" }); return; }
    doCreate();
  };

  const filtered = catFilter ? vendors.filter((v) => v.category === catFilter) : vendors;
  const activeCount = vendors.filter((v) => v.status === "ACTIVE").length;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Vendor Control" />

      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: theme.colors.success }]}>{activeCount}</Text>
          <Text style={s.summaryLabel}>Active</Text>
        </View>
        <View style={s.summarySep} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: theme.colors.textPrimary }]}>{vendors.length}</Text>
          <Text style={s.summaryLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={[null, ...CATEGORIES]}
        keyExtractor={(c) => c ?? "all"}
        renderItem={({ item: c }) => (
          <TouchableOpacity style={[s.chip, catFilter === c && s.chipActive]} onPress={() => setCatFilter(c)}>
            <Text style={[s.chipText, catFilter === c && s.chipTextActive]}>{c ?? "All"}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ gap: 8, padding: theme.spacing.md }}
        style={{ backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
      />

      {isLoading ? <View style={{ flex: 1 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <VendorCard
              vendor={item}
              onRate={(id, r) => handleRate(id, r)}
              onToggleStatus={(id) => { const v = vendors.find((x) => x.id === id); if (v) handleToggle(v); }}
              onDelete={handleDelete}
            />
          )}
          ListEmptyComponent={
            <EmptyState emoji="🔧" title="No vendors registered" subtitle="Tap + to add your first vendor." />
          }
          contentContainerStyle={s.listContent}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => setShowAdd(true)}>
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Quick add modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowAdd(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Add Vendor</Text>
            <Text style={s.fieldLabel}>Category</Text>
            <FlatList horizontal showsHorizontalScrollIndicator={false}
              data={CATEGORIES} keyExtractor={(c) => c}
              renderItem={({ item: c }) => (
                <TouchableOpacity style={[s.chip, newCat === c && s.chipActive]} onPress={() => setNewCat(c)}>
                  <Text style={[s.chipText, newCat === c && s.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
            />
            <Text style={s.fieldLabel}>Name *</Text>
            <TextInput style={s.input} value={newName} onChangeText={setNewName} placeholder="Vendor or company name" placeholderTextColor={theme.colors.textDisabled} />
            <Text style={s.fieldLabel}>Phone</Text>
            <TextInput style={s.input} value={newPhone} onChangeText={setNewPhone} placeholder="+919876543210" keyboardType="phone-pad" placeholderTextColor={theme.colors.textDisabled} />
            <LoadingButton title="Add Vendor" loadingTitle="Adding…" onPress={handleAdd} isLoading={creating} style={{ marginTop: theme.spacing.lg }} />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: theme.spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  vendorName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  vendorCat: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.full, borderWidth: 1 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.sm },
  jobsText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  notes: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, fontStyle: "italic", marginBottom: theme.spacing.sm },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.sm },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  contactText: { fontSize: theme.fontSize.xs },
  rightActions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 4 },
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
  cancelBtn: { marginTop: theme.spacing.md, alignItems: "center" as any, paddingVertical: 12 },
  cancelBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  cancelText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
