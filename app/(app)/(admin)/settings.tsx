/**
 * Admin Settings — Phase 17
 */
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "../../../src/components/common/AppHeader";
import { useAuthStore } from "../../../src/store/auth.store";
import { getTenantSubscription } from "../../../src/api/admin";
import { theme } from "../../../src/theme";

const APP_VERSION = "1.0.0";

interface SettingsRow {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  rightLabel?: string;
  color?: string;
}

function SettingsItem({ icon, label, subtitle, onPress, rightLabel, color }: SettingsRow) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.rowIcon, { backgroundColor: (color ?? theme.colors.primary) + "18" }]}>
        <MaterialIcons name={icon as any} size={20} color={color ?? theme.colors.primary} />
      </View>
      <View style={s.rowText}>
        <Text style={s.rowLabel}>{label}</Text>
        {subtitle ? <Text style={s.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightLabel ? (
        <Text style={s.rightLabel}>{rightLabel}</Text>
      ) : (
        <MaterialIcons name="chevron-right" size={20} color={theme.colors.textDisabled} />
      )}
    </TouchableOpacity>
  );
}

export default function AdminSettingsScreen() {
  const { user } = useAuthStore();

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.tenantId],
    queryFn: () => getTenantSubscription(user?.tenantId ?? ""),
    enabled: !!user?.tenantId,
  });

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Settings" showNotifications={false} />
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Subscription info */}
        <View style={s.planCard}>
          <View style={s.planLeft}>
            <MaterialIcons name="workspace-premium" size={28} color="#F39C12" />
            <View>
              <Text style={s.planName}>
                {subscription?.plan?.name ?? "Standard Plan"}
              </Text>
              <Text style={s.planStatus}>
                {subscription?.status === "ACTIVE" ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
          <View style={s.planBadge}>
            <Text style={s.planBadgeText}>
              {subscription?.plan?.tier ?? "PRO"}
            </Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Configuration</Text>
        <View style={s.section}>
          <SettingsItem
            icon="notifications"
            label="Notification Config"
            subtitle="Push, SMS, WhatsApp settings"
            onPress={() => {}}
          />
          <SettingsItem
            icon="history"
            label="Audit Log"
            subtitle="Review all admin actions"
            onPress={() => {}}
          />
          <SettingsItem
            icon="security"
            label="Access Control"
            subtitle="Role permissions & policies"
            onPress={() => {}}
          />
        </View>

        <Text style={s.sectionTitle}>Plan & Billing</Text>
        <View style={s.section}>
          <SettingsItem
            icon="workspace-premium"
            label="Subscription Details"
            subtitle="View & manage your plan"
            onPress={() => {}}
          />
          <SettingsItem
            icon="receipt-long"
            label="Invoices"
            subtitle="Billing history"
            onPress={() => {}}
          />
        </View>

        <Text style={s.sectionTitle}>App</Text>
        <View style={s.section}>
          <SettingsItem
            icon="info"
            label="App Version"
            rightLabel={`v${APP_VERSION}`}
            onPress={() => {}}
          />
          <SettingsItem
            icon="policy"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <SettingsItem
            icon="article"
            label="Terms of Service"
            onPress={() => {}}
          />
        </View>

        <View style={s.tenantInfo}>
          <Text style={s.tenantInfoLabel}>Tenant ID</Text>
          <Text style={s.tenantInfoValue} selectable>
            {user?.tenantId ?? "N/A"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8E6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F39C1244",
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.sm,
  },
  planLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  planName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  planStatus: { fontSize: theme.fontSize.xs, color: theme.colors.success, marginTop: 2 },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    backgroundColor: "#F39C1222",
    borderWidth: 1,
    borderColor: "#F39C1244",
  },
  planBadgeText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, color: "#E67E22" },
  sectionTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    ...theme.shadow.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  rowText: { flex: 1 },
  rowLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  rowSubtitle: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  rightLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium },
  tenantInfo: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tenantInfoLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 4 },
  tenantInfoValue: { fontSize: theme.fontSize.sm, color: theme.colors.textDisabled, fontFamily: "monospace" },
});
