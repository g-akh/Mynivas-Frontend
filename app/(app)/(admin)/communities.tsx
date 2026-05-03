/**
 * Admin Communities — Phase 17
 * GET /v1/communities | Create via onboarding
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
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "../../../src/components/common/AppHeader";
import EmptyState from "../../../src/components/common/EmptyState";
import LoadingButton from "../../../src/components/common/LoadingButton";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { listCommunities, createOnboarding } from "../../../src/api/admin";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatRelative } from "../../../src/utils/format";

function CommunityCard({ item }: { item: any }) {
  return (
    <View style={s.card}>
      <View style={s.cardLeft}>
        <View style={s.iconBox}>
          <MaterialIcons name="location-city" size={22} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={s.communityName}>{item.name}</Text>
          {item.city ? (
            <View style={s.cityRow}>
              <MaterialIcons name="place" size={12} color={theme.colors.textSecondary} />
              <Text style={s.cityText}>{item.city}</Text>
            </View>
          ) : null}
          {item.created_at ? (
            <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
          ) : null}
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={theme.colors.textDisabled} />
    </View>
  );
}

export default function AdminCommunitiesScreen() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [cityName, setCityName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  const { data: communities = [], isLoading, refetch } = useQuery({
    queryKey: ["communities"],
    queryFn: listCommunities,
    staleTime: 60_000,
  });

  const { mutate: createComm, isPending: isCreating } = useMutation({
    mutationFn: () =>
      createOnboarding(
        {
          tenant: { name: user?.name ?? "Tenant" },
          community: {
            name: communityName.trim(),
            timezone: "Asia/Kolkata",
            address: cityName.trim(),
          },
          adminUser: {
            name: "Admin",
            phone: adminPhone.trim(),
          },
        },
        `create-comm-${Date.now()}`
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      showToast({ type: "success", message: "Community created!" });
      setCommunityName("");
      setCityName("");
      setAdminPhone("");
      setShowModal(false);
    },
    onError: () => showToast({ type: "error", message: "Failed to create community" }),
  });

  const handleCreate = () => {
    if (!communityName.trim()) {
      showToast({ type: "error", message: "Community name is required" });
      return;
    }
    if (!adminPhone.trim()) {
      showToast({ type: "error", message: "Admin phone is required" });
      return;
    }
    createComm();
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Communities" />

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <FlatList
          data={communities}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => <CommunityCard item={item} />}
          ListEmptyComponent={
            <EmptyState
              emoji="🏘"
              title="No communities yet"
              subtitle="Create your first community."
              actionLabel="Add Community"
              onAction={() => setShowModal(true)}
            />
          }
          contentContainerStyle={s.listContent}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)}>
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>New Community</Text>

            <Text style={s.fieldLabel}>Community Name *</Text>
            <TextInput
              style={s.input}
              value={communityName}
              onChangeText={setCommunityName}
              placeholder="e.g. Sunrise Apartments"
              placeholderTextColor={theme.colors.textDisabled}
            />

            <Text style={[s.fieldLabel, { marginTop: theme.spacing.md }]}>City / Address</Text>
            <TextInput
              style={s.input}
              value={cityName}
              onChangeText={setCityName}
              placeholder="e.g. Bengaluru, Karnataka"
              placeholderTextColor={theme.colors.textDisabled}
            />

            <Text style={[s.fieldLabel, { marginTop: theme.spacing.md }]}>Admin Phone *</Text>
            <TextInput
              style={s.input}
              value={adminPhone}
              onChangeText={setAdminPhone}
              placeholder="+919876543210"
              placeholderTextColor={theme.colors.textDisabled}
              keyboardType="phone-pad"
            />

            <LoadingButton
              title="Create Community"
              loadingTitle="Creating..."
              onPress={handleCreate}
              isLoading={isCreating}
              style={{ marginTop: theme.spacing.lg }}
            />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { padding: theme.spacing.md, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  communityName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  cityText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  timeText: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled, marginTop: 2 },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadow.lg,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
    ...theme.shadow.lg,
  },
  modalTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary, marginBottom: 6 },
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
  cancelBtn: { marginTop: theme.spacing.md, paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
