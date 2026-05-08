/**
 * Resident Settings — persisted via user-service API
 * - Notification preferences
 * - Household members
 * - Vehicles
 * - My flat info + Help
 */
import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Modal, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "../../../src/components/common/AppHeader";
import LoadingButton from "../../../src/components/common/LoadingButton";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import {
  listHousehold, addHouseholdMember, deleteHouseholdMember, HouseholdMember,
  listVehicles, addVehicle, deleteVehicle, UserVehicle,
  getNotificationPrefs, updateNotificationPrefs, NotificationPrefs,
} from "../../../src/api/userSettings";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";

const RELATIONS      = ["Spouse", "Parent", "Child", "Sibling", "Tenant", "Other"];
const VEHICLE_TYPES  = ["Car", "Bike", "Scooter", "Bicycle", "Other"];
const VEHICLE_ICONS: Record<string, string> = {
  Car: "directions-car", Bike: "two-wheeler", Scooter: "electric-scooter",
  Bicycle: "pedal-bike", Other: "commute",
};

// ─── Section header ───────────────────────────────────────────────────────────

function Section({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={s.sectionHeader}>
      <MaterialIcons name={icon as any} size={16} color={theme.colors.primary} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Notification prefs ───────────────────────────────────────────────────────

function NotifPrefsSection({ userId }: { userId: string }) {
  const qc = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notif-prefs", userId],
    queryFn: () => getNotificationPrefs(userId),
    staleTime: 60_000,
  });

  const { mutate: save } = useMutation({
    mutationFn: (patch: Partial<NotificationPrefs>) => updateNotificationPrefs(userId, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notif-prefs", userId] }),
  });

  const defaults: NotificationPrefs = {
    visitor_alerts: true, delivery_alerts: true, payment_reminders: true,
    announcements: true, complaints: true, amenity_bookings: false,
  };
  const current: NotificationPrefs = { ...defaults, ...(prefs ?? {}) };

  const rows: { key: keyof NotificationPrefs; label: string; sub: string }[] = [
    { key: "visitor_alerts",    label: "Visitor Alerts",      sub: "When someone arrives at the gate" },
    { key: "delivery_alerts",   label: "Delivery Alerts",     sub: "Parcel / food delivery" },
    { key: "payment_reminders", label: "Payment Reminders",   sub: "Maintenance dues & bills" },
    { key: "announcements",     label: "Announcements",       sub: "Society notices & broadcasts" },
    { key: "complaints",        label: "Complaint Updates",   sub: "Status changes on your complaints" },
    { key: "amenity_bookings",  label: "Booking Reminders",   sub: "Upcoming amenity bookings" },
  ];

  if (isLoading) return <SkeletonList count={3} />;

  return (
    <View style={s.card}>
      {rows.map((row, i) => (
        <View key={row.key} style={[s.prefRow, i < rows.length - 1 && s.prefRowBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={s.prefLabel}>{row.label}</Text>
            <Text style={s.prefSub}>{row.sub}</Text>
          </View>
          <Switch
            value={current[row.key]}
            onValueChange={(v) => save({ [row.key]: v })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + "80" }}
            thumbColor={current[row.key] ? theme.colors.primary : "#f4f3f4"}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Household members ────────────────────────────────────────────────────────

function HouseholdSection({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName]       = useState("");
  const [relation, setRelation] = useState("Spouse");
  const [phone, setPhone]     = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["household", userId],
    queryFn: () => listHousehold(userId),
    staleTime: 60_000,
  });

  const { mutate: doAdd, isPending: adding } = useMutation({
    mutationFn: () => addHouseholdMember(userId, { name: name.trim(), relation, phone: phone.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household", userId] });
      showToast({ type: "success", message: "Member added" });
      setName(""); setPhone(""); setRelation("Spouse"); setShowAdd(false);
    },
    onError: () => showToast({ type: "error", message: "Failed to add" }),
  });

  const { mutate: doRemove } = useMutation({
    mutationFn: (memberId: string) => deleteHouseholdMember(userId, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["household", userId] }),
  });

  const handleRemove = (m: HouseholdMember) => Alert.alert("Remove", `Remove ${m.name}?`, [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => doRemove(m.id) },
  ]);

  return (
    <View style={s.card}>
      {isLoading ? null : members.length === 0 ? (
        <Text style={s.emptyText}>No household members added yet.</Text>
      ) : (
        members.map((m) => (
          <View key={m.id} style={s.listRow}>
            <View style={s.listAvatar}>
              <Text style={s.listAvatarText}>{m.name[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.listLabel}>{m.name}</Text>
              <Text style={s.listSub}>{m.relation}{m.phone ? ` · ${m.phone}` : ""}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemove(m)}>
              <MaterialIcons name="delete-outline" size={18} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
        <MaterialIcons name="person-add" size={16} color={theme.colors.primary} />
        <Text style={s.addBtnText}>Add Member</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowAdd(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Add Household Member</Text>
            <Text style={s.fieldLabel}>Name *</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={theme.colors.textDisabled} />
            <Text style={s.fieldLabel}>Relation</Text>
            <View style={s.chipRow}>
              {RELATIONS.map((r) => (
                <TouchableOpacity key={r} style={[s.chip, relation === r && s.chipActive]} onPress={() => setRelation(r)}>
                  <Text style={[s.chipText, relation === r && s.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>Phone (optional)</Text>
            <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="+919876543210" keyboardType="phone-pad" placeholderTextColor={theme.colors.textDisabled} />
            <LoadingButton title="Add Member" loadingTitle="Adding…" onPress={() => { if (!name.trim()) { showToast({ type: "error", message: "Name required" }); return; } doAdd(); }} isLoading={adding} style={{ marginTop: theme.spacing.lg }} />
            <TouchableOpacity style={s.cancelRow} onPress={() => setShowAdd(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

function VehiclesSection({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [number, setNumber]   = useState("");
  const [type, setType]       = useState("Car");
  const [color, setColor]     = useState("");

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles", userId],
    queryFn: () => listVehicles(userId),
    staleTime: 60_000,
  });

  const { mutate: doAdd, isPending: adding } = useMutation({
    mutationFn: () => addVehicle(userId, { number: number.trim().toUpperCase(), type, color: color.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles", userId] });
      showToast({ type: "success", message: "Vehicle added" });
      setNumber(""); setColor(""); setType("Car"); setShowAdd(false);
    },
    onError: () => showToast({ type: "error", message: "Failed to add" }),
  });

  const { mutate: doRemove } = useMutation({
    mutationFn: (vehicleId: string) => deleteVehicle(userId, vehicleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles", userId] }),
  });

  const handleRemove = (v: UserVehicle) => Alert.alert("Remove", `Remove ${v.number}?`, [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => doRemove(v.id) },
  ]);

  return (
    <View style={s.card}>
      {isLoading ? null : vehicles.length === 0 ? (
        <Text style={s.emptyText}>No vehicles added yet.</Text>
      ) : (
        vehicles.map((v) => (
          <View key={v.id} style={s.listRow}>
            <View style={[s.listAvatar, { backgroundColor: "#3498DB20" }]}>
              <MaterialIcons name={(VEHICLE_ICONS[v.type] ?? "commute") as any} size={18} color="#3498DB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.listLabel}>{v.number}</Text>
              <Text style={s.listSub}>{v.type}{v.color ? ` · ${v.color}` : ""}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemove(v)}>
              <MaterialIcons name="delete-outline" size={18} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
        <MaterialIcons name="add" size={16} color={theme.colors.primary} />
        <Text style={s.addBtnText}>Add Vehicle</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowAdd(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Add Vehicle</Text>
            <Text style={s.fieldLabel}>Type</Text>
            <View style={s.chipRow}>
              {VEHICLE_TYPES.map((t) => (
                <TouchableOpacity key={t} style={[s.chip, type === t && s.chipActive]} onPress={() => setType(t)}>
                  <Text style={[s.chipText, type === t && s.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>Vehicle Number *</Text>
            <TextInput style={s.input} value={number} onChangeText={setNumber} placeholder="e.g. KA01AB1234" autoCapitalize="characters" placeholderTextColor={theme.colors.textDisabled} />
            <Text style={s.fieldLabel}>Color (optional)</Text>
            <TextInput style={s.input} value={color} onChangeText={setColor} placeholder="e.g. White" placeholderTextColor={theme.colors.textDisabled} />
            <LoadingButton title="Add Vehicle" loadingTitle="Adding…" onPress={() => { if (!number.trim()) { showToast({ type: "error", message: "Vehicle number required" }); return; } doAdd(); }} isLoading={adding} style={{ marginTop: theme.spacing.lg }} />
            <TouchableOpacity style={s.cancelRow} onPress={() => setShowAdd(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ResidentSettingsScreen() {
  const { user } = useAuthStore();
  const userId = user?.id ?? "";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={s.content}>

        <Section title="My Flat" icon="home" />
        <View style={s.card}>
          {[
            { icon: "person",        label: "Name",         value: user?.name        ?? "—" },
            { icon: "phone",         label: "Phone",        value: user?.phone       ?? "—" },
            { icon: "location-city", label: "Community ID", value: `#${user?.communityId?.slice(-8)?.toUpperCase() ?? "—"}` },
          ].map((row) => (
            <View key={row.label} style={s.infoRow}>
              <MaterialIcons name={row.icon as any} size={16} color={theme.colors.textSecondary} />
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={s.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <Section title="Notification Preferences" icon="notifications" />
        <NotifPrefsSection userId={userId} />

        <Section title="Household Members" icon="people" />
        <HouseholdSection userId={userId} />

        <Section title="My Vehicles" icon="directions-car" />
        <VehiclesSection userId={userId} />

        <Section title="Help & Support" icon="help-outline" />
        <View style={s.card}>
          {[
            { label: "FAQs",            icon: "quiz" },
            { label: "Contact Support", icon: "headset-mic" },
            { label: "Terms of Use",    icon: "description" },
            { label: "Privacy Policy",  icon: "privacy-tip" },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={s.helpRow} onPress={() => showToast({ type: "success", message: `Opening ${item.label}…` })}>
              <MaterialIcons name={item.icon as any} size={18} color={theme.colors.textSecondary} />
              <Text style={s.helpLabel}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={18} color={theme.colors.textDisabled} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  sectionTitle: { fontSize: theme.fontSize.sm, fontWeight: "700", color: theme.colors.textPrimary, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, ...theme.shadow.sm },
  prefRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  prefRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  prefLabel: { fontSize: theme.fontSize.sm, fontWeight: "600", color: theme.colors.textPrimary },
  prefSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  emptyText: { fontSize: theme.fontSize.sm, color: theme.colors.textDisabled, textAlign: "center", paddingVertical: theme.spacing.md },
  listRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  listAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary + "20", justifyContent: "center", alignItems: "center" },
  listAvatarText: { fontSize: 14, fontWeight: "700", color: theme.colors.primary },
  listLabel: { fontSize: theme.fontSize.sm, fontWeight: "600", color: theme.colors.textPrimary },
  listSub: { fontSize: 11, color: theme.colors.textSecondary },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: theme.spacing.md, justifyContent: "center" },
  addBtnText: { fontSize: theme.fontSize.sm, fontWeight: "600", color: theme.colors.primary },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  infoLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, width: 90 },
  infoValue: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontWeight: "500" },
  helpRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  helpLabel: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.xl },
  sheetTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: "600", color: theme.colors.textPrimary, marginBottom: 6, marginTop: theme.spacing.md },
  input: { height: 48, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, backgroundColor: theme.colors.background },
  cancelRow: { marginTop: theme.spacing.md, alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
