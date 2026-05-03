/**
 * Resident Billing — Phase 12
 * GET /v1/billing/dues
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../../src/components/common/AppHeader";
import StatusBadge from "../../../../src/components/common/StatusBadge";
import EmptyState from "../../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../../src/components/common/SkeletonLoader";
import { useDuesList } from "../../../../src/hooks/useBilling";
import { theme } from "../../../../src/theme";
import { formatDate, formatCurrency, formatRelative } from "../../../../src/utils/format";
import type { LedgerStatus, LedgerEntry } from "../../../../src/types";

const STATUS_FILTERS: { label: string; value: LedgerStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Waived", value: "WAIVED" },
];

function SummaryCard({ dues }: { dues: LedgerEntry[] }) {
  const total = dues.reduce((sum, d) => sum + d.amount, 0);
  const overdue = dues
    .filter((d) => d.status === "OVERDUE")
    .reduce((sum, d) => sum + d.amount, 0);
  const pending = dues
    .filter((d) => d.status === "PENDING")
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <View style={s.summaryCard}>
      <Text style={s.summaryTitle}>Balance Overview</Text>
      <View style={s.summaryRow}>
        <View style={s.summaryItem}>
          <Text style={s.summaryAmount}>{formatCurrency(total)}</Text>
          <Text style={s.summaryLabel}>Total Due</Text>
        </View>
        <View style={s.summarySep} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryAmount, { color: theme.colors.danger }]}>
            {formatCurrency(overdue)}
          </Text>
          <Text style={s.summaryLabel}>Overdue</Text>
        </View>
        <View style={s.summarySep} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryAmount, { color: theme.colors.warning }]}>
            {formatCurrency(pending)}
          </Text>
          <Text style={s.summaryLabel}>Pending</Text>
        </View>
      </View>
    </View>
  );
}

function DuesCard({ item }: { item: LedgerEntry }) {
  const isOverdue = item.status === "OVERDUE";
  const isPaid = item.status === "PAID";

  return (
    <View style={[s.card, isOverdue && s.cardOverdue]}>
      <View style={s.cardHeader}>
        <View style={s.chargeInfo}>
          <Text style={s.chargeId}>Charge #{item.charge_def_id.slice(-6).toUpperCase()}</Text>
          <Text style={s.period}>{item.period}</Text>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>

      <View style={s.amountRow}>
        <Text style={[s.amount, isPaid && { color: theme.colors.success }]}>
          {formatCurrency(item.amount)}
        </Text>
      </View>

      <View style={s.cardFooter}>
        <View style={s.dueDateRow}>
          <MaterialIcons
            name="calendar-today"
            size={12}
            color={isOverdue ? theme.colors.danger : theme.colors.textSecondary}
          />
          <Text style={[s.dueDate, isOverdue && { color: theme.colors.danger }]}>
            Due: {formatDate(item.due_date)}
          </Text>
        </View>
        <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
      </View>
    </View>
  );
}

export default function ResidentBillingScreen() {
  const [activeStatus, setActiveStatus] = useState<LedgerStatus | undefined>(undefined);
  const { data: dues = [], isLoading, refetch } = useDuesList(activeStatus);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Billing" showBack />

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <FlatList
          data={dues}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          ListHeaderComponent={
            <View>
              <SummaryCard dues={dues} />
              <View style={s.filterRow}>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={STATUS_FILTERS}
                  keyExtractor={(f) => f.label}
                  renderItem={({ item: f }) => {
                    const active = activeStatus === f.value;
                    return (
                      <TouchableOpacity
                        style={[s.chip, active && s.chipActive]}
                        onPress={() => setActiveStatus(f.value)}
                      >
                        <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={{ gap: 8 }}
                />
              </View>
              <Text style={s.sectionTitle}>
                {activeStatus ? `${activeStatus} Dues` : "All Dues"} ({dues.length})
              </Text>
            </View>
          }
          renderItem={({ item }) => <DuesCard item={item} />}
          ListEmptyComponent={
            <EmptyState
              emoji="💰"
              title="No dues found"
              subtitle="You have no dues matching the selected filter."
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
  summaryCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadow.md,
  },
  summaryTitle: {
    fontSize: theme.fontSize.sm,
    color: "rgba(255,255,255,0.75)",
    marginBottom: theme.spacing.md,
    fontWeight: theme.fontWeight.medium,
  },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryAmount: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: "#FFFFFF" },
  summaryLabel: { fontSize: theme.fontSize.xs, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  summarySep: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.25)" },
  filterRow: { marginBottom: theme.spacing.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.textSecondary },
  chipTextActive: { color: "#FFFFFF" },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  cardOverdue: { borderColor: theme.colors.danger + "55", backgroundColor: theme.colors.danger + "05" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  chargeInfo: {},
  chargeId: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  period: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  amountRow: { marginBottom: theme.spacing.sm },
  amount: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dueDateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dueDate: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  timeText: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled },
});
