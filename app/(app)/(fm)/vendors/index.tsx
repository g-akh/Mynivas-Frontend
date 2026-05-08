/**
 * FM — Vendor Management (persisted via community-service API)
 */
import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Linking, Alert, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "../../../../src/components/common/AppHeader";
import LoadingButton from "../../../../src/components/common/LoadingButton";
import EmptyState from "../../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../../src/components/common/SkeletonLoader";
import { listVendors, createVendor, updateVendor, deleteVendor, Vendor } from "../../../../src/api/community";
import { useAuthStore } from "../../../../src/store/auth.store";
import { showToast } from "../../../../src/store/ui.store";
import { theme } from "../../../../src/theme";

const CATEGORIES = ["Plumbing","Electrical","Carpentry","Cleaning","Painting","Security","Landscaping","IT/CCTV","Lifts","Other"];
const CATEGORY_ICONS: Record<string,string> = {
  Plumbing:"water-damage",Electrical:"electrical-services",Carpentry:"carpenter",
  Cleaning:"cleaning-services",Painting:"format-paint",Security:"security",
  Landscaping:"park","IT/CCTV":"videocam",Lifts:"elevator",Other:"handyman",
};

function VendorCard({ vendor, communityId, onRefresh }: { vendor: Vendor; communityId: string; onRefresh: () => void }) {
  const qc = useQueryClient();
  const { mutate: doUpdate } = useMutation({
    mutationFn: (patch: Parameters<typeof updateVendor>[2]) => updateVendor(communityId, vendor.id, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vendors", communityId] }); showToast({ type: "success", message: "Updated" }); },
  });
  const { mutate: doDelete } = useMutation({
    mutationFn: () => deleteVendor(communityId, vendor.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors", communityId] }),
  });
  const icon = CATEGORY_ICONS[vendor.category] ?? "handyman";
  const isActive = vendor.status === "ACTIVE";

  const handleDelete = () => Alert.alert("Remove Vendor", `Remove ${vendor.name}?`, [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => doDelete() },
  ]);

  const handleToggle = () => doUpdate({ status: isActive ? "INACTIVE" : "ACTIVE" });

  const handleRate = (r: number) => doUpdate({ rating: r });

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.avatar, { backgroundColor: theme.colors.primary + "20" }]}>
          <MaterialIcons name={icon as any} size={20} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.vendorName}>{vendor.name}</Text>
          <Text style={s.vendorCat}>{vendor.category}</Text>
        </View>
        <View style={[s.statusChip, { backgroundColor: isActive ? theme.colors.success + "15" : theme.colors.danger + "15", borderColor: isActive ? theme.colors.success + "44" : theme.colors.danger + "44" }]}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: isActive ? theme.colors.success : theme.colors.danger }}>{vendor.status}</Text>
        </View>
      </View>

      {/* Star rating */}
      <View style={s.starsRow}>
        {[1,2,3,4,5].map((star) => (
          <TouchableOpacity key={star} onPress={() => handleRate(star)}>
            <MaterialIcons name={star <= vendor.rating ? "star" : "star-border"} size={16} color={star <= vendor.rating ? "#F39C12" : theme.colors.textDisabled} />
          </TouchableOpacity>
        ))}
        <Text style={s.jobsText}>{vendor.total_jobs} jobs</Text>
      </View>

      {vendor.notes ? <Text style={s.notes}>{vendor.notes}</Text> : null}

      <View style={s.actionRow}>
        {vendor.phone ? (
          <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL(`tel:${vendor.phone}`)}>
            <MaterialIcons name="call" size={14} color={theme.colors.primary} />
            <Text style={[s.contactText, { color: theme.colors.primary }]}>{vendor.phone}</Text>
          </TouchableOpacity>
        ) : null}
        <View style={s.rightBtns}>
          <TouchableOpacity style={s.iconBtn} onPress={handleToggle}>
            <MaterialIcons name={isActive ? "block" : "check-circle"} size={18} color={isActive ? theme.colors.danger : theme.colors.success} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={handleDelete}>
            <MaterialIcons name="delete-outline" size={18} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function AddVendorModal({ visible, communityId, onClose }: { visible: boolean; communityId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName]         = useState("");
  const [category, setCategory] = useState("Plumbing");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [notes, setNotes]       = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => createVendor(communityId, { name: name.trim(), category, phone: phone.trim(), email: email.trim(), notes: notes.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors", communityId] });
      showToast({ type: "success", message: "Vendor added" });
      setName(""); setPhone(""); setEmail(""); setNotes(""); setCategory("Plumbing");
      onClose();
    },
    onError: () => showToast({ type: "error", message: "Failed to add vendor" }),
  });

  const handleAdd = () => {
    if (!name.trim()) { showToast({ type: "error", message: "Name is required" }); return; }
    mutate();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>Add Vendor</Text>
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
          <Text style={s.fieldLabel}>Vendor / Company Name *</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Raju Plumbing" placeholderTextColor={theme.colors.textDisabled} />
          <Text style={s.fieldLabel}>Phone</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="+919876543210" keyboardType="phone-pad" placeholderTextColor={theme.colors.textDisabled} />
          <Text style={s.fieldLabel}>Email (optional)</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="vendor@email.com" keyboardType="email-address" placeholderTextColor={theme.colors.textDisabled} />
          <Text style={s.fieldLabel}>Notes (optional)</Text>
          <TextInput style={[s.input, { height: 64 }]} value={notes} onChangeText={setNotes} placeholder="Rates, specialisation…" multiline placeholderTextColor={theme.colors.textDisabled} />
          <LoadingButton title="Add Vendor" loadingTitle="Adding…" onPress={handleAdd} isLoading={isPending} style={{ marginTop: theme.spacing.lg }} />
          <TouchableOpacity style={s.cancelRow} onPress={onClose}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function FMVendorsScreen() {
  const { user } = useAuthStore();
  const communityId = user?.communityId ?? "";
  const [showAdd, setShowAdd]   = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const { data: vendors = [], isLoading, refetch } = useQuery({
    queryKey: ["vendors", communityId],
    queryFn: () => listVendors(communityId),
    enabled: !!communityId,
    staleTime: 30_000,
  });

  const filtered = catFilter ? vendors.filter((v) => v.category === catFilter) : vendors;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Vendors" />

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
          renderItem={({ item }) => <VendorCard vendor={item} communityId={communityId} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState emoji="🔧" title="No vendors yet" subtitle="Tap + to add your first vendor." />}
          contentContainerStyle={s.listContent}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => setShowAdd(true)}>
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <AddVendorModal visible={showAdd} communityId={communityId} onClose={() => setShowAdd(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { padding: theme.spacing.md, paddingBottom: 90 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.shadow.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: theme.spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  vendorName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  vendorCat: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.full, borderWidth: 1 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: theme.spacing.sm },
  jobsText: { marginLeft: 6, fontSize: 11, color: theme.colors.textSecondary },
  notes: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, fontStyle: "italic", marginBottom: theme.spacing.sm },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.sm },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  contactText: { fontSize: theme.fontSize.xs },
  rightBtns: { flexDirection: "row", gap: 8 },
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
  cancelText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
