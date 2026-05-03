/**
 * Super Admin Tenants — Phase 17
 * GET /v1/tenants | POST /v1/tenants | PATCH /v1/tenants/:id
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
import StatusBadge from "../../../src/components/common/StatusBadge";
import EmptyState from "../../../src/components/common/EmptyState";
import LoadingButton from "../../../src/components/common/LoadingButton";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { listTenants, createTenant, updateTenant } from "../../../src/api/admin";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatRelative } from "../../../src/utils/format";

function TenantCard({
  item,
  onToggleStatus,
}: {
  item: any;
  onToggleStatus: (id: string, status: string) => void;
}) {
  const isActive = item.status === "ACTIVE";
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.nameRow}>
          <View style={s.tenantAvatar}>
            <Text style={s.tenantAvatarText}>
              {item.name?.charAt(0)?.toUpperCase() ?? "T"}
            </Text>
          </View>
          <View>
            <Text style={s.tenantName}>{item.name}</Text>
            {item.created_at ? (
              <Text style={s.tenantTime}>{formatRelative(item.created_at)}</Text>
            ) : null}
          </View>
        </View>
        {item.status ? <StatusBadge status={item.status} size="sm" /> : null}
      </View>
      <View style={s.actionsRow}>
        <TouchableOpacity
          style={[s.statusBtn, isActive ? s.deactivateBtn : s.activateBtn]}
          onPress={() => onToggleStatus(item.id, isActive ? "INACTIVE" : "ACTIVE")}
        >
          <Text style={[s.statusBtnText, { color: isActive ? theme.colors.danger : theme.colors.success }]}>
            {isActive ? "Deactivate" : "Activate"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminTenantsScreen() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [tenantName, setTenantName] = useState("");

  const { data: tenants = [], isLoading, refetch } = useQuery({
    queryKey: ["tenants"],
    queryFn: listTenants,
    staleTime: 60_000,
  });

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: () => createTenant({ name: tenantName.trim(), status: "ACTIVE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      showToast({ type: "success", message: "Tenant created!" });
      setTenantName("");
      setShowModal(false);
    },
    onError: () => showToast({ type: "error", message: "Failed to create tenant" }),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTenant(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      showToast({ type: "success", message: "Tenant updated" });
    },
  });

  const handleCreate = () => {
    if (!tenantName.trim()) {
      showToast({ type: "error", message: "Tenant name is required" });
      return;
    }
    create();
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Tenants" />

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <FlatList
          data={tenants}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TenantCard
              item={item}
              onToggleStatus={(id, status) => toggle({ id, status })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="🏢"
              title="No tenants yet"
              subtitle="Add your first tenant to get started."
              actionLabel="Add Tenant"
              onAction={() => setShowModal(true)}
            />
          }
          contentContainerStyle={s.listContent}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)}>
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>New Tenant</Text>
            <Text style={s.fieldLabel}>Tenant Name *</Text>
            <TextInput
              style={s.input}
              value={tenantName}
              onChangeText={setTenantName}
              placeholder="Enter organization name"
              placeholderTextColor={theme.colors.textDisabled}
              autoFocus
            />
            <LoadingButton
              title="Create Tenant"
              loadingTitle="Creating..."
              onPress={handleCreate}
              isLoading={isCreating}
              style={{ marginTop: theme.spacing.lg }}
            />
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => setShowModal(false)}
            >
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
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tenantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  tenantAvatarText: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: "#FFFFFF" },
  tenantName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  tenantTime: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end" },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  activateBtn: { backgroundColor: theme.colors.success + "10", borderColor: theme.colors.success + "44" },
  deactivateBtn: { backgroundColor: theme.colors.danger + "10", borderColor: theme.colors.danger + "44" },
  statusBtnText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold },
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
  cancelBtn: {
    marginTop: theme.spacing.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
