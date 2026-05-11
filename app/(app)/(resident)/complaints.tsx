import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, ScrollView, TextInput,
  KeyboardAvoidingView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../src/components/common/AppHeader";
import StatusBadge from "../../../src/components/common/StatusBadge";
import PrioritySelector from "../../../src/components/common/PrioritySelector";
import LoadingButton from "../../../src/components/common/LoadingButton";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { useComplaintList, useCreateComplaint } from "../../../src/hooks/useComplaints";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { getErrorMessage } from "../../../src/api/client";
import { COMPLAINT_CATEGORIES } from "../../../src/api/complaints";
import { formatRelative } from "../../../src/utils/format";
import { theme } from "../../../src/theme";
import type { Complaint, ComplaintPriority } from "../../../src/types";

function ComplaintCard({ item }: { item: Complaint }) {
  return (
    <View style={s.card}>
      <View style={s.cardRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={s.cat}>{item.category}</Text>
          <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
        </View>
        <View style={{ gap: 4, alignItems: "flex-end" }}>
          <StatusBadge status={item.status} size="sm" />
          <StatusBadge status={item.priority} size="sm" />
        </View>
      </View>
      <Text style={s.time}>{formatRelative(item.created_at)}</Text>
    </View>
  );
}

function NewComplaintModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  const { mutate, isPending } = useCreateComplaint();
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<ComplaintPriority>("MEDIUM");
  const [description, setDescription] = useState("");
  const [showCats, setShowCats] = useState(false);
  const canSubmit = category.length > 0 && description.length >= 20;

  const submit = () => {
    if (!user) return;
    mutate(
      { communityId: user.communityId, unitId: user.unitId ?? user.communityId, tenantId: user.tenantId, category, priority, description },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Complaint submitted!" });
          setCategory(""); setPriority("MEDIUM"); setDescription("");
          onClose();
        },
        onError: (err) => showToast({ type: "error", message: getErrorMessage(err) }),
      }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={s.modalHdr}>
          <Text style={s.modalTitle}>New Complaint</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <Text style={s.label}>Category *</Text>
            <TouchableOpacity style={s.selector} onPress={() => setShowCats(!showCats)}>
              <Text style={{ color: category ? theme.colors.textPrimary : theme.colors.textDisabled }}>
                {category || "Select category"}
              </Text>
              <MaterialIcons name={showCats ? "expand-less" : "expand-more"} size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            {showCats && (
              <View style={s.dropdown}>
                {COMPLAINT_CATEGORIES.map(c => (
                  <TouchableOpacity key={c} style={[s.dropItem, category === c && s.dropSel]}
                    onPress={() => { setCategory(c); setShowCats(false); }}>
                    <Text style={{ color: category === c ? theme.colors.primary : theme.colors.textPrimary, fontWeight: category === c ? "600" : "400" }}>{c}</Text>
                    {category === c && <MaterialIcons name="check" size={16} color={theme.colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={[s.label, { marginTop: 20 }]}>Priority *</Text>
            <PrioritySelector value={priority} onChange={setPriority} />
            <Text style={[s.label, { marginTop: 20 }]}>Description * (min 20 chars)</Text>
            <TextInput
              style={s.textarea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={theme.colors.textDisabled}
              multiline
              numberOfLines={5}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={s.charCount}>
              {description.length}/1000{description.length < 20 ? ` — need ${20 - description.length} more` : " ✓"}
            </Text>
            <LoadingButton
              title="Submit Complaint"
              loadingTitle="Submitting…"
              onPress={submit}
              isLoading={isPending}
              disabled={!canSubmit}
              style={{ marginTop: 24 }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export default function ResidentComplaintsScreen() {
  const [showNew, setShowNew] = useState(false);
  const { data = [], isLoading, refetch } = useComplaintList();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader
        title="My Complaints"
        rightAction={{ icon: "add-circle-outline", onPress: () => setShowNew(true) }}
      />
      {isLoading ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={data}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <ComplaintCard item={item} />}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.colors.primary} />}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              emoji="📋"
              title="No complaints yet"
              subtitle="Tap + to raise a new complaint"
              actionLabel="Raise Complaint"
              onAction={() => setShowNew(true)}
            />
          }
        />
      )}
      <NewComplaintModal visible={showNew} onClose={() => setShowNew(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  card: {
    backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cat:  { fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary, marginBottom: 3 },
  desc: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 17 },
  time: { fontSize: 10, color: theme.colors.textDisabled },
  modalHdr: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.textPrimary },
  label: { fontSize: 13, fontWeight: "600", color: theme.colors.textPrimary, marginBottom: 8 },
  selector: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    height: 48, borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: 10, paddingHorizontal: 14, backgroundColor: theme.colors.surface,
  },
  dropdown:  { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, marginTop: 4, overflow: "hidden" },
  dropItem:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  dropSel:   { backgroundColor: "#E3F2FD" },
  textarea: {
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 10,
    padding: 12, minHeight: 120, fontSize: 14, color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  charCount: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4, textAlign: "right" },
});
