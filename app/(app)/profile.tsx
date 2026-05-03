/**
 * Profile & Settings screen
 * PATCH /v1/users/:userId  |  POST /v1/auth/logout
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert
} from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../src/components/common/AppHeader";
import LoadingButton from "../../src/components/common/LoadingButton";
import ConfirmDialog from "../../src/components/common/ConfirmDialog";
import { logoutApi, getMe } from "../../src/api/auth";
import { updateUser } from "../../src/api/admin";
import { useAuthStore } from "../../src/store/auth.store";
import { showToast } from "../../src/store/ui.store";
import { getErrorMessage } from "../../src/api/client";
import { formatPhone, formatRole } from "../../src/utils/format";
import { theme } from "../../src/theme";
import Constants from "expo-constants";

function MenuRow({
  icon, label, value, onPress, danger = false, showArrow = true,
}: {
  icon: string; label: string; value?: string; onPress?: () => void;
  danger?: boolean; showArrow?: boolean;
}) {
  return (
    <TouchableOpacity style={s.menuRow} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[s.menuIcon, { backgroundColor: danger ? theme.colors.danger + "15" : "#EBF5FB" }]}>
        <MaterialIcons name={icon as any} size={18} color={danger ? theme.colors.danger : theme.colors.primary} />
      </View>
      <Text style={[s.menuLabel, danger && { color: theme.colors.danger }]}>{label}</Text>
      {value ? <Text style={s.menuValue}>{value}</Text> : null}
      {showArrow && onPress ? <MaterialIcons name="chevron-right" size={18} color={theme.colors.textDisabled} /> : null}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? "");
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const { mutate: saveName, isPending: savingName } = useMutation({
    mutationFn: () => updateUser(user!.id, { name: newName.trim() }),
    onSuccess: async () => {
      // Re-fetch user to update local store
      const fresh = await getMe();
      await useAuthStore.getState().setSession(fresh, useAuthStore.getState().accessToken!, "");
      setEditNameVisible(false);
      showToast({ type: "success", message: "Name updated!" });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => showToast({ type: "error", message: getErrorMessage(err) }),
  });

  const { mutate: doLogout, isPending: loggingOut } = useMutation({
    mutationFn: async () => {
      await logoutApi();
      await logout();
    },
    onSuccess: () => router.replace("/(auth)/login"),
    onError: async () => {
      // Logout locally even if API call fails
      await logout();
      router.replace("/(auth)/login");
    },
  });

  if (!user) return null;

  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Profile & Settings" showNotifications={false} showProfile={false} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(user.name || user.phone).charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{user.name || "—"}</Text>
            <Text style={s.userPhone}>{formatPhone(user.phone)}</Text>
            <View style={s.roleRow}>
              {user.roles.map(r => (
                <View key={r} style={s.roleChip}>
                  <Text style={s.roleChipText}>{formatRole(r)}</Text>
                </View>
              ))}
            </View>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={() => { setNewName(user.name ?? ""); setEditNameVisible(true); }}>
            <MaterialIcons name="edit" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Account */}
        <SectionHeader title="ACCOUNT" />
        <View style={s.section}>
          <MenuRow icon="person" label="Full Name" value={user.name || "Not set"} onPress={() => { setNewName(user.name ?? ""); setEditNameVisible(true); }} />
          <MenuRow icon="phone" label="Mobile Number" value={formatPhone(user.phone)} showArrow={false} />
          <MenuRow icon="apartment" label="Community" value={user.communityId.slice(0, 8) + "…"} showArrow={false} />
        </View>

        {/* App Settings */}
        <SectionHeader title="APP" />
        <View style={s.section}>
          <MenuRow icon="notifications" label="Notifications" value="Enabled" onPress={() => {}} />
          <MenuRow icon="language" label="Language" value="English" onPress={() => showToast({ type: "info", message: "More languages coming soon!" })} />
          <MenuRow icon="info-outline" label="App Version" value={`v${version}`} showArrow={false} />
        </View>

        {/* Legal */}
        <SectionHeader title="LEGAL" />
        <View style={s.section}>
          <MenuRow icon="description" label="Terms of Service" onPress={() => showToast({ type: "info", message: "Opening terms…" })} />
          <MenuRow icon="privacy-tip" label="Privacy Policy" onPress={() => showToast({ type: "info", message: "Opening privacy policy…" })} />
        </View>

        {/* Logout */}
        <SectionHeader title="" />
        <View style={s.section}>
          <MenuRow icon="logout" label="Sign Out" danger onPress={() => setLogoutConfirm(true)} />
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={editNameVisible} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.editModal}>
            <Text style={s.editModalTitle}>Edit Name</Text>
            <TextInput
              style={s.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Your full name"
              placeholderTextColor={theme.colors.textDisabled}
              autoFocus
              returnKeyType="done"
            />
            <View style={s.editModalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditNameVisible(false)}>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: "500" }}>Cancel</Text>
              </TouchableOpacity>
              <LoadingButton
                title="Save"
                onPress={() => saveName()}
                isLoading={savingName}
                disabled={!newName.trim() || newName.trim() === user.name}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirm */}
      <ConfirmDialog
        visible={logoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to verify your OTP again to log back in."
        confirmLabel="Sign Out"
        destructive
        isLoading={loggingOut}
        onConfirm={() => doLogout()}
        onCancel={() => setLogoutConfirm(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  profileCard: { flexDirection: "row", alignItems: "center", margin: 16, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow.sm },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 24, fontWeight: "700", color: "#fff" },
  userName: { fontSize: 17, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 2 },
  userPhone: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  roleChip: { backgroundColor: theme.colors.primary + "15", paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10 },
  roleChipText: { fontSize: 11, color: theme.colors.primary, fontWeight: "600" },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#EBF5FB", justifyContent: "center", alignItems: "center" },
  sectionHeader: { fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
  section: { backgroundColor: theme.colors.surface, marginHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  menuLabel: { flex: 1, fontSize: 14, color: theme.colors.textPrimary, fontWeight: "500" },
  menuValue: { fontSize: 13, color: theme.colors.textSecondary, marginRight: 4 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  editModal: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, margin: 24, width: "88%" },
  editModalTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 16 },
  nameInput: { borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: 8, padding: 12, fontSize: 15, color: theme.colors.textPrimary, marginBottom: 16 },
  editModalActions: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, height: 44, justifyContent: "center", alignItems: "center", borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
});
