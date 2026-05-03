/**
 * FM Reports & Analytics Hub
 * Tabs: Complaints | Visitors | Maintenance | Export
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../../src/components/common/AppHeader";
import { getDashboard } from "../../../../src/api/reports";
import { apiClient } from "../../../../src/api/client";
import { useAuthStore } from "../../../../src/store/auth.store";
import { formatDate } from "../../../../src/utils/format";
import { theme } from "../../../../src/theme";
import dayjs from "dayjs";

type TabKey = "complaints" | "visitors" | "maintenance" | "export";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "complaints", label: "Complaints", icon: "report-problem" },
  { key: "visitors",   label: "Visitors",   icon: "people" },
  { key: "maintenance",label: "Maintenance",icon: "build" },
  { key: "export",     label: "Export",     icon: "download" },
];

const PRESETS = [
  { label: "7D",  days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
    </View>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={s.barRow}>
      <Text style={s.barLabel} numberOfLines={1}>{label}</Text>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={s.barValue}>{value}</Text>
    </View>
  );
}

function ComplaintsTab({ data }: { data: any }) {
  if (!data) return null;
  const statusEntries = Object.entries(data.by_status ?? {}) as [string, number][];
  const maxStatus = Math.max(...statusEntries.map(([, v]) => v), 1);
  const statusColors: Record<string, string> = { NEW: "#3498DB", ASSIGNED: "#9B59B6", IN_PROGRESS: "#F39C12", RESOLVED: "#27AE60", CLOSED: "#95A5A6" };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={s.statsRow}>
        <StatCard label="Total" value={data.total_created ?? 0} />
        <StatCard label="Avg Resolution" value={data.avg_resolution_hours != null ? `${Number(data.avg_resolution_hours).toFixed(1)}h` : "—"} />
        <StatCard label="SLA Breach" value={data.sla_breach_rate != null ? `${Number(data.sla_breach_rate).toFixed(1)}%` : "—"} />
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>By Status</Text>
        {statusEntries.map(([status, count]) => (
          <BarRow key={status} label={status} value={count} max={maxStatus} color={statusColors[status] ?? theme.colors.primary} />
        ))}
      </View>
      {data.by_category?.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Top Categories</Text>
          {data.by_category.slice(0, 5).map((c: any) => (
            <BarRow key={c.category} label={c.category} value={c.count} max={data.by_category[0].count} color={theme.colors.primary} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function VisitorsTab({ data }: { data: any }) {
  if (!data) return null;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={s.statsRow}>
        <StatCard label="Total" value={data.total_visitors ?? 0} />
        <StatCard label="Approval Rate" value={data.approval_rate != null ? `${Number(data.approval_rate).toFixed(1)}%` : "—"} />
        <StatCard label="Avg Duration" value={data.avg_duration_minutes != null ? `${Number(data.avg_duration_minutes).toFixed(0)}m` : "—"} />
      </View>
      <View style={s.statsRow}>
        <StatCard label="Blocked Attempted" value={data.blocked_entries_attempted ?? 0} sub="blocked attempts" />
      </View>
      {data.peak_hours && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Peak Hours</Text>
          <View style={s.heatRow}>
            {(data.peak_hours as number[]).map((count, hour) => {
              const max = Math.max(...(data.peak_hours as number[]));
              const intensity = max > 0 ? count / max : 0;
              return (
                <View key={hour} style={[s.heatCell, { backgroundColor: `rgba(27,79,114,${0.1 + intensity * 0.9})` }]}>
                  <Text style={[s.heatText, { color: intensity > 0.5 ? "#fff" : theme.colors.textSecondary }]}>{hour}</Text>
                </View>
              );
            })}
          </View>
          <Text style={s.heatNote}>Each cell = hour of day (0–23)</Text>
        </View>
      )}
    </ScrollView>
  );
}

function MaintenanceTab({ data }: { data: any }) {
  if (!data) return null;
  const wo = data.work_orders ?? {};
  const ppm = data.ppm ?? {};
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={s.groupTitle}>Work Orders</Text>
      <View style={s.statsRow}>
        <StatCard label="Total" value={wo.total ?? 0} />
        <StatCard label="Avg Completion" value={wo.avg_completion_hours != null ? `${Number(wo.avg_completion_hours).toFixed(1)}h` : "—"} />
        <StatCard label="Blocked Rate" value={wo.blocked_rate != null ? `${Number(wo.blocked_rate).toFixed(1)}%` : "—"} />
      </View>
      <View style={s.statsRow}>
        <StatCard label="Avg Rating" value={wo.avg_rating != null ? `⭐ ${Number(wo.avg_rating).toFixed(1)}` : "—"} />
      </View>
      <Text style={s.groupTitle}>PPM</Text>
      <View style={s.statsRow}>
        <StatCard label="Active Schedules" value={ppm.total_schedules ?? 0} />
        <StatCard label="Compliance" value={ppm.compliance_rate != null ? `${Number(ppm.compliance_rate).toFixed(1)}%` : "—"} />
        <StatCard label="Overdue" value={ppm.overdue_count ?? 0} />
      </View>
    </ScrollView>
  );
}

function ExportTab({ communityId, from, to }: { communityId: string; from: string; to: string }) {
  const [exporting, setExporting] = useState<string | null>(null);
  const types = [
    { key: "complaints", label: "Complaints", icon: "report-problem" },
    { key: "visitors", label: "Visitors", icon: "people" },
    { key: "work-orders", label: "Work Orders", icon: "build" },
    { key: "payments", label: "Payments", icon: "payment" },
  ];

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      const res = await apiClient.get(`/v1/reports/export/${type}`, {
        params: { from, to, community_id: communityId },
        responseType: "blob",
      });
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-export-${from}-${to}.csv`;
      a.click();
    } catch {
      const { showToast: st } = require("../../../../src/store/ui.store");
      st({ type: "error", message: "Export failed. Try a shorter date range." });
    } finally {
      setExporting(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={s.exportInfo}>
        <MaterialIcons name="info-outline" size={16} color={theme.colors.info} />
        <Text style={s.exportInfoText}>Exporting data from {formatDate(from)} to {formatDate(to)}. Max 90 days.</Text>
      </View>
      {types.map(t => (
        <TouchableOpacity key={t.key} style={s.exportCard} onPress={() => handleExport(t.key)} disabled={exporting === t.key}>
          <View style={[s.exportIcon, { backgroundColor: theme.colors.primary + "15" }]}>
            {exporting === t.key
              ? <ActivityIndicator size="small" color={theme.colors.primary} />
              : <MaterialIcons name={t.icon as any} size={22} color={theme.colors.primary} />}
          </View>
          <Text style={s.exportLabel}>{t.label} CSV</Text>
          <MaterialIcons name="download" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export default function ReportsScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("complaints");
  const [preset, setPreset] = useState(1); // 30 days default

  const to   = dayjs().format("YYYY-MM-DD");
  const from = dayjs().subtract(PRESETS[preset].days, "day").format("YYYY-MM-DD");
  const communityId = user?.communityId ?? "";

  const { data: complaintsData, isLoading: cLoading, refetch: cRefetch } = useQuery({
    queryKey: ["reports-complaints", communityId, from, to],
    queryFn: () => apiClient.get("/v1/reports/complaints", { params: { from, to, community_id: communityId } }).then(r => r.data),
    enabled: !!communityId && activeTab === "complaints",
    staleTime: 300_000,
  });

  const { data: visitorsData, isLoading: vLoading, refetch: vRefetch } = useQuery({
    queryKey: ["reports-visitors", communityId, from, to],
    queryFn: () => apiClient.get("/v1/reports/visitors", { params: { from, to, community_id: communityId } }).then(r => r.data),
    enabled: !!communityId && activeTab === "visitors",
    staleTime: 300_000,
  });

  const { data: maintData, isLoading: mLoading, refetch: mRefetch } = useQuery({
    queryKey: ["reports-maintenance", communityId, from, to],
    queryFn: () => apiClient.get("/v1/reports/maintenance", { params: { from, to, community_id: communityId } }).then(r => r.data),
    enabled: !!communityId && activeTab === "maintenance",
    staleTime: 300_000,
  });

  const isLoading = (activeTab === "complaints" && cLoading) || (activeTab === "visitors" && vLoading) || (activeTab === "maintenance" && mLoading);
  const refetch = activeTab === "complaints" ? cRefetch : activeTab === "visitors" ? vRefetch : mRefetch;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Reports & Analytics" showBack />

      {/* Date preset chips */}
      <View style={s.presetRow}>
        {PRESETS.map((p, i) => (
          <TouchableOpacity key={p.label} style={[s.presetChip, preset === i && s.presetActive]} onPress={() => setPreset(i)}>
            <Text style={[s.presetText, preset === i && s.presetTextActive]}>Last {p.label}</Text>
          </TouchableOpacity>
        ))}
        <Text style={s.dateRange}>{formatDate(from)} – {formatDate(to)}</Text>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, activeTab === t.key && s.tabActive]} onPress={() => setActiveTab(t.key)}>
            <MaterialIcons name={t.icon as any} size={16} color={activeTab === t.key ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[s.tabText, activeTab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={s.loadingCenter}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : (
        activeTab === "complaints" ? <ComplaintsTab data={complaintsData} /> :
        activeTab === "visitors" ? <VisitorsTab data={visitorsData} /> :
        activeTab === "maintenance" ? <MaintenanceTab data={maintData} /> :
        <ExportTab communityId={communityId} from={from} to={to} />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  presetRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  presetChip: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  presetActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  presetText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "500" },
  presetTextActive: { color: "#fff" },
  dateRange: { flex: 1, textAlign: "right", fontSize: 11, color: theme.colors.textDisabled },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
  tab: { flex: 1, flexDirection: "column", alignItems: "center", paddingVertical: 10, gap: 2 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 10, color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.primary, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: theme.colors.border },
  statValue: { fontSize: 22, fontWeight: "700", color: theme.colors.textPrimary },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, textAlign: "center", marginTop: 2 },
  statSub: { fontSize: 10, color: theme.colors.textDisabled, textAlign: "center" },
  section: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 },
  groupTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  barLabel: { width: 90, fontSize: 12, color: theme.colors.textSecondary },
  barBg: { flex: 1, height: 8, backgroundColor: theme.colors.background, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barValue: { width: 30, fontSize: 12, color: theme.colors.textPrimary, textAlign: "right", fontWeight: "600" },
  heatRow: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  heatCell: { width: 28, height: 28, borderRadius: 4, justifyContent: "center", alignItems: "center" },
  heatText: { fontSize: 10, fontWeight: "500" },
  heatNote: { fontSize: 10, color: theme.colors.textDisabled, marginTop: 6 },
  exportInfo: { flexDirection: "row", gap: 8, backgroundColor: "#EBF5FB", padding: 12, borderRadius: 8, alignItems: "flex-start" },
  exportInfoText: { flex: 1, fontSize: 12, color: theme.colors.textSecondary, lineHeight: 17 },
  exportCard: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.border, gap: 14 },
  exportIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  exportLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: theme.colors.textPrimary },
});
