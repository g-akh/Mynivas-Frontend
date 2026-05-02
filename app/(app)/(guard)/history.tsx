/**
 * Guard Visitor History — Phase 14
 * GET /v1/visitors ordered by created_at DESC
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../src/components/common/AppHeader";
import StatusBadge from "../../../src/components/common/StatusBadge";
import EmptyState from "../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { useVisitorList } from "../../../src/hooks/useVisitors";
import { theme } from "../../../src/theme";
import { formatDateTime, formatRelative } from "../../../src/utils/format";
import type { Visitor } from "../../../src/types";

const VISITOR_TYPE_COLOR: Record<string, string> = {
  GUEST: "#3498DB",
  COURIER: "#F39C12",
  SERVICE: "#9B59B6",
  VENDOR: "#E67E22",
};

function HistoryCard({ item }: { item: Visitor }) {
  const typeColor = VISITOR_TYPE_COLOR[item.visitor_type] ?? theme.colors.primary;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.left}>
          <View
            style={[
              s.typeCircle,
              { backgroundColor: typeColor + "20", borderColor: typeColor + "44" },
            ]}
          >
            <MaterialIcons name="person" size={18} color={typeColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.visitorName}>{item.visitor_name}</Text>
            {item.visitor_phone ? (
              <Text style={s.visitorPhone}>{item.visitor_phone}</Text>
            ) : null}
          </View>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>

      <View style={s.metaRow}>
        <View
          style={[
            s.typeChip,
            { backgroundColor: typeColor + "15", borderColor: typeColor + "40" },
          ]}
        >
          <Text style={[s.typeText, { color: typeColor }]}>{item.visitor_type}</Text>
        </View>
        <Text style={s.unitText}>
          Unit #{item.unit_id.slice(-6).toUpperCase()}
        </Text>
      </View>

      <View style={s.timesRow}>
        {item.entry_at ? (
          <View style={s.timeItem}>
            <MaterialIcons name="login" size={12} color={theme.colors.success} />
            <Text style={s.timeItemText}>{formatDateTime(item.entry_at)}</Text>
          </View>
        ) : null}
        {item.exit_at ? (
          <View style={s.timeItem}>
            <MaterialIcons name="logout" size={12} color={theme.colors.textSecondary} />
            <Text style={s.timeItemText}>{formatDateTime(item.exit_at)}</Text>
          </View>
        ) : null}
        <Text style={s.relativeTime}>{formatRelative(item.created_at)}</Text>
      </View>
    </View>
  );
}

export default function GuardHistoryScreen() {
  const { data = [], isLoading, refetch } = useVisitorList(undefined);

  // Sort by created_at DESC
  const sorted = [...data].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Visitor History" />

      {isLoading ? (
        <SkeletonList count={5} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => <HistoryCard item={item} />}
          ListEmptyComponent={
            <EmptyState
              emoji="📋"
              title="No visitor history"
              subtitle="No visitors have been logged yet."
            />
          }
          contentContainerStyle={s.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  typeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  visitorName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  visitorPhone: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: theme.spacing.xs,
  },
  typeChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  typeText: { fontSize: 10, fontWeight: theme.fontWeight.semibold },
  unitText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  timesRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  timeItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  timeItemText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  relativeTime: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled, marginLeft: "auto" },
});
