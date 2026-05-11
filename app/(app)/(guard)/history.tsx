/**
 * Guard Visitor History — Purple design
 */
import React from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import StatusBadge from "../../../src/components/common/StatusBadge";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import AppHeader from "../../../src/components/common/AppHeader";
import { useVisitorList } from "../../../src/hooks/useVisitors";
import { guardTheme as g } from "../../../src/theme/guardTheme";
import { formatDateTime, formatRelative } from "../../../src/utils/format";
import type { Visitor } from "../../../src/types";

const TYPE_COLOR: Record<string, string> = {
  GUEST: "#7B1FA2", COURIER: "#FB8C00", SERVICE: "#6E3482", VENDOR: "#EF6C00",
};

function HistoryCard({ item }: { item: Visitor }) {
  const typeColor = TYPE_COLOR[item.visitor_type] ?? g.colors.primary;
  const initials  = (item.visitor_name ?? "?")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.avatar, { backgroundColor: typeColor + "22" }]}>
          <Text style={[s.avatarText, { color: typeColor }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.visitorName}>{item.visitor_name}</Text>
          {item.visitor_phone ? <Text style={s.visitorPhone}>{item.visitor_phone}</Text> : null}
          <View style={s.metaRow}>
            <View style={[s.typeChip, { backgroundColor: typeColor + "18", borderColor: typeColor + "44" }]}>
              <Text style={[s.typeText, { color: typeColor }]}>{item.visitor_type}</Text>
            </View>
            <Text style={s.unitText}>#{item.unit_id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>

      <View style={s.timesRow}>
        {item.entry_at && (
          <View style={s.timeItem}>
            <MaterialIcons name="login" size={12} color={g.colors.success} />
            <Text style={s.timeItemText}>{formatDateTime(item.entry_at)}</Text>
          </View>
        )}
        {item.exit_at && (
          <View style={s.timeItem}>
            <MaterialIcons name="logout" size={12} color={g.colors.textSecondary} />
            <Text style={s.timeItemText}>{formatDateTime(item.exit_at)}</Text>
          </View>
        )}
        <Text style={s.relTime}>{formatRelative(item.created_at)}</Text>
      </View>
    </View>
  );
}

export default function GuardHistoryScreen() {
  const { data = [], isLoading, refetch } = useVisitorList(undefined);
  const sorted = [...data].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader
        title="Visitor History"
        gradientColors={["#49225B", "#6E3482", "#7B3F9A"]}
      />
      {isLoading ? <SkeletonList count={5} /> : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={g.colors.primary} />}
          renderItem={({ item }) => <HistoryCard item={item} />}
          ListEmptyComponent={<EmptyState emoji="📋" title="No visitor history" subtitle="No visitors logged yet." />}
          contentContainerStyle={s.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: g.colors.background },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: g.colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: g.colors.border,
    padding: 16, marginBottom: 10, ...g.shadow.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  avatar:     { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "800" },
  visitorName:  { fontSize: 15, fontWeight: "700", color: g.colors.textPrimary },
  visitorPhone: { fontSize: 12, color: g.colors.textSecondary, marginTop: 1 },
  metaRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 },
  typeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  typeText: { fontSize: 11, fontWeight: "600" },
  unitText: { fontSize: 11, color: g.colors.textSecondary },
  timesRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  timeItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  timeItemText: { fontSize: 11, color: g.colors.textSecondary },
  relTime:  { fontSize: 11, color: g.colors.textDisabled, marginLeft: "auto" },
});
