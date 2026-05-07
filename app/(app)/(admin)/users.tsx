/**
 * Community Admin Users — Phase 17
 * GET /v1/users | POST /v1/users
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "../../../src/components/common/AppHeader";
import EmptyState from "../../../src/components/common/EmptyState";
import LoadingButton from "../../../src/components/common/LoadingButton";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { listUsers, createUser, updateUser, deleteUser } from "../../../src/api/admin";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { formatRole, formatRelative } from "../../../src/utils/format";
import { theme } from "../../../src/theme";
import type { UserRole } from "../../../src/types";

const ROLE_OPTIONS: UserRole[] = [
  "RESIDENT",
  "GUARD",
  "TECHNICIAN",
  "FM",
  "COMMUNITY_ADMIN",
];

const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: "#E74C3C",
  TENANT_ADMIN: "#C0392B",
  COMMUNITY_ADMIN: "#8E44AD",
  FM: "#2980B9",
  TECHNICIAN: "#27AE60",
  GUARD: "#E67E22",
  RESIDENT: "#3498DB",
};

function UserCard({ item, onEdit, onDelete }: { item: any; onEdit: (user: any) => void; onDelete: (user: any) => void }) {
  const roles: string[] = item.roles ?? [];
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.nameRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {(item.name ?? item.phone ?? "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{item.name ?? "User"}</Text>
            <Text style={s.userPhone}>{item.phone ?? ""}</Text>
            {item.created_at ? (
              <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => onEdit(item)} style={s.editBtn}>
            <MaterialIcons name="edit" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item)} style={s.deleteBtn}>
            <MaterialIcons name="delete" size={18} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.rolesRow}>
        {roles.map((role) => {
          const color = ROLE_COLOR[role] ?? theme.colors.primary;
          return (
            <View
              key={role}
              style={[s.roleBadge, { backgroundColor: color + "15", borderColor: color + "44" }]}
            >
              <Text style={[s.roleBadgeText, { color }]}>{formatRole(role)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminUsersScreen() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("RESIDENT");

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    staleTime: 60_000,
  });

  const { mutate: inviteUser, isPending: isInviting } = useMutation({
    mutationFn: (vars: { phone: string; name: string; selectedRole: UserRole }) =>
      createUser({
        tenantId: user?.tenantId ?? "",
        communityId: user?.communityId ?? "",
        phone: vars.phone,
        name: vars.name || undefined,
        roles: [vars.selectedRole],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      showToast({ type: "success", message: "User invited!" });
      setPhone("");
      setName("");
      setSelectedRole("RESIDENT");
      setShowModal(false);
    },
    onError: () => showToast({ type: "error", message: "Failed to invite user" }),
  });

  const { mutate: editUser, isPending: isEditing } = useMutation({
    mutationFn: (vars: { id: string; name: string; status?: string }) =>
      updateUser(vars.id, { name: vars.name || undefined, status: vars.status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      showToast({ type: "success", message: "User updated!" });
      setEditingUser(null);
    },
    onError: () => showToast({ type: "error", message: "Failed to update user" }),
  });

  const { mutate: removeUser } = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      showToast({ type: "success", message: "User deleted" });
    },
    onError: () => showToast({ type: "error", message: "Failed to delete user" }),
  });

  const handleDelete = (userItem: any) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${userItem.name ?? userItem.phone ?? "this user"}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => removeUser(userItem.id) },
      ]
    );
  };

  const handleEdit = (userItem: any) => {
    setEditingUser(userItem);
    setName(userItem.name ?? "");
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    editUser({ id: editingUser.id, name: name.trim() });
  };

  const handleInvite = () => {
    let finalPhone = phone.trim();
    if (!finalPhone) {
      showToast({ type: "error", message: "Phone number is required" });
      return;
    }
    
    // Auto-prepend +91 if user just typed 10 digits
    if (/^\d{10}$/.test(finalPhone)) {
      finalPhone = "+91" + finalPhone;
    } else if (!/^\+[1-9]\d{9,14}$/.test(finalPhone)) {
      showToast({ type: "error", message: "Enter a valid mobile number with country code (e.g. +919876543210)" });
      return;
    }

    inviteUser({ phone: finalPhone, name: name.trim(), selectedRole });
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Users" />

      {isLoading ? (
        <SkeletonList count={5} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => <UserCard item={item} onEdit={handleEdit} onDelete={handleDelete} />}
          ListEmptyComponent={
            <EmptyState
              emoji="👥"
              title="No users yet"
              subtitle="Invite your first user to get started."
              actionLabel="Invite User"
              onAction={() => setShowModal(true)}
            />
          }
          contentContainerStyle={s.listContent}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)}>
        <MaterialIcons name="person-add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Edit User Modal */}
      <Modal visible={!!editingUser} transparent animationType="slide">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditingUser(null)}
        >
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Edit User</Text>
            <Text style={s.fieldLabel}>Name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={theme.colors.textDisabled}
            />
            <LoadingButton
              title="Save Changes"
              loadingTitle="Saving..."
              onPress={handleSaveEdit}
              isLoading={isEditing}
              style={{ marginTop: theme.spacing.lg }}
            />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setEditingUser(null)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Invite User Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Invite User</Text>

            <Text style={s.fieldLabel}>Phone Number *</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+919876543210"
              placeholderTextColor={theme.colors.textDisabled}
              keyboardType="phone-pad"
            />

            <Text style={[s.fieldLabel, { marginTop: theme.spacing.md }]}>Name (optional)</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={theme.colors.textDisabled}
            />

            <Text style={[s.fieldLabel, { marginTop: theme.spacing.md }]}>Role *</Text>
            <View style={s.roleGrid}>
              {ROLE_OPTIONS.map((role) => {
                const active = selectedRole === role;
                const color = ROLE_COLOR[role] ?? theme.colors.primary;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[
                      s.roleChip,
                      active
                        ? { backgroundColor: color, borderColor: color }
                        : { borderColor: theme.colors.border },
                    ]}
                    onPress={() => setSelectedRole(role)}
                  >
                    <Text style={[s.roleChipText, { color: active ? "#FFFFFF" : theme.colors.textSecondary }]}>
                      {formatRole(role)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <LoadingButton
              title="Invite User"
              loadingTitle="Inviting..."
              onPress={handleInvite}
              isLoading={isInviting}
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
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  cardHeader: { marginBottom: theme.spacing.sm },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: "#FFFFFF" },
  userName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  userPhone: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  timeText: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled, marginTop: 2 },
  rolesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  roleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  roleBadgeText: { fontSize: 10, fontWeight: theme.fontWeight.semibold },
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
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
  },
  roleChipText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold },
  cancelBtn: { marginTop: theme.spacing.md, paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  editBtn: { padding: 8, borderRadius: 20, backgroundColor: theme.colors.primary + "15" },
  deleteBtn: { padding: 8, borderRadius: 20, backgroundColor: theme.colors.danger + "15", marginLeft: 6 },
});
