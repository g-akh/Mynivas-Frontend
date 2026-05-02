/**
 * Super Admin Overview — Phase 17
 * GET /v1/tenants + GET /v1/onboarding
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "../../../src/components/common/AppHeader";
import StatusBadge from "../../../src/components/common/StatusBadge";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { listTenants, listCommunities } from "../../../src/api/admin";
import { theme } from "../../../src/theme";
import { formatRelative } from "../../../src/utils/format";

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <View style={[s.statCard, { borderLeftColor: color }]}>
      <View style={[s.statIcon, { backgroundColor: color + "18" }]}>
        <MaterialIcons name={icon as any} size={22} color={color} />
      </View>
      <View>
        <Text style={s.statValue}>{value}</Text>
        <Text style={s.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function AdminOverviewScreen() {
  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: listTenants,
    staleTime: 60_000,
  });

  const communitiesQuery = useQuery({
    queryKey: ["communities"],
    queryFn: listCommunities,
    staleTime: 60_000,
  });

  const tenants = tenantsQuery.data ?? [];
  const communities = communitiesQuery.data ?? [];
  const isLoading = tenantsQuery.isLoading || communitiesQuery.isLoading;

  const handleRefresh = () => {
    tenantsQuery.refetch();
    communitiesQuery.refetch();
  };

  // Recent tenants (last 5 by creation)
  const recentTenants = [...tenants]
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    )
    .slice(0, 5);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Admin Overview" />

      {isLoading ? (
        <SkeletonList count={3} />
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Stats */}
          <Text style={s.sectionTitle}>Platform Statistics</Text>
          <View style={s.statsGrid}>
            <StatCard
              icon="business"
              label="Tenants"
              value={tenants.length}
              color="#3498DB"
            />
            <StatCard
              icon="location-city"
              label="Communities"
              value={communities.length}
              color="#27AE60"
            />
            <StatCard
              icon="check-circle"
              label="Active"
              value={tenants.filter((t) => t.status === "ACTIVE").length}
              color={theme.colors.success}
            />
            <StatCard
              icon="pending"
              label="Pending"
              value={tenants.filter((t) => t.status !== "ACTIVE").length}
              color={theme.colors.warning}
            />
          </View>

          {/* Recent tenants */}
          <Text style={s.sectionTitle}>Recent Tenants</Text>
          {recentTenants.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>No tenants yet</Text>
            </View>
          ) : (
            recentTenants.map((tenant) => (
              <View key={tenant.id} style={s.tenantRow}>
                <View style={s.tenantAvatar}>
                  <Text style={s.tenantAvatarText}>
                    {tenant.name?.charAt(0)?.toUpperCase() ?? "T"}
                  </Text>
                </View>
                <View style={s.tenantInfo}>
                  <Text style={s.tenantName}>{tenant.name}</Text>
                  {tenant.created_at ? (
                    <Text style={s.tenantTime}>{formatRelative(tenant.created_at)}</Text>
                  ) : null}
                </View>
                {tenant.status ? <StatusBadge status={tenant.status} size="sm" /> : null}
              </View>
            ))
          )}

          {/* All communities summary */}
          <Text style={[s.sectionTitle, { marginTop: theme.spacing.lg }]}>
            Communities ({communities.length})
          </Text>
          {communities.slice(0, 6).map((c) => (
            <View key={c.id} style={s.communityRow}>
              <MaterialIcons name="location-city" size={18} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.communityName}>{c.name}</Text>
                {c.city ? <Text style={s.communityCity}>{c.city}</Text> : null}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 3,
    padding: theme.spacing.md,
    flex: 1,
    minWidth: "45%",
    ...theme.shadow.sm,
  },
  statIcon: { width: 40, height: 40, borderRadius: theme.borderRadius.md, justifyContent: "center", alignItems: "center" },
  statValue: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  statLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  tenantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  tenantAvatarText: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: "#FFFFFF" },
  tenantInfo: { flex: 1 },
  tenantName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  tenantTime: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  emptyBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  emptyText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  communityName: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  communityCity: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
});
