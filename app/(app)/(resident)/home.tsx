/**
 * Resident Home — Phase 04
 * GET /v1/announcements  (announcement feed)
 */
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../src/components/common/AppHeader";
import StatusBadge from "../../../src/components/common/StatusBadge";
import { listAnnouncements, acknowledgeAnnouncement } from "../../../src/api/announcements";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { formatRelative } from "../../../src/utils/format";
import { theme } from "../../../src/theme";
import type { Announcement } from "../../../src/types";

const PRIORITY_COLOR: Record<string, string> = {
  NORMAL:    theme.colors.surface,
  IMPORTANT: "#FFF8E6",
  EMERGENCY: "#FFF0F0",
};

const PRIORITY_BORDER: Record<string, string> = {
  NORMAL:    theme.colors.border,
  IMPORTANT: theme.colors.warning,
  EMERGENCY: theme.colors.danger,
};

function AnnouncementCard({ item, userId }: { item: Announcement; userId: string }) {
  const qc = useQueryClient();
  const { mutate: ack, isPending } = useMutation({
    mutationFn: () => acknowledgeAnnouncement(item.id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      showToast({ type: "success", message: "Acknowledged!" });
    },
  });

  return (
    <View style={[
      styles.card,
      { backgroundColor: PRIORITY_COLOR[item.priority] ?? theme.colors.surface,
        borderColor: PRIORITY_BORDER[item.priority] ?? theme.colors.border }
    ]}>
      {item.priority === "EMERGENCY" && (
        <View style={styles.emergencyBanner}>
          <MaterialIcons name="warning" size={14} color={theme.colors.danger} />
          <Text style={styles.emergencyText}>EMERGENCY ALERT</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <StatusBadge status={item.priority} size="sm" />
      </View>
      <Text style={styles.cardBody} numberOfLines={3}>{item.body}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardTime}>{formatRelative(item.created_at)}</Text>
        {item.type === "POLL" && (
          <TouchableOpacity style={styles.pollBtn}
            onPress={() => router.push({ pathname: "/(app)/(resident)/more", params: { screen: "announcements", id: item.id } } as any)}>
            <Text style={styles.pollBtnText}>View Poll →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function QuickActionRow({ userId }: { userId: string }) {
  const actions = [
    { icon: "report-problem", label: "Complaint", route: "/(app)/(resident)/complaints" },
    { icon: "people",         label: "Visitors",  route: "/(app)/(resident)/visitors" },
    { icon: "event",          label: "Book",      route: "/(app)/(resident)/bookings" },
    { icon: "folder",         label: "Docs",      route: "/(app)/(resident)/more" },
  ];
  return (
    <View style={styles.quickRow}>
      {actions.map((a) => (
        <TouchableOpacity key={a.label} style={styles.quickItem}
          onPress={() => router.push(a.route as any)}>
          <View style={styles.quickCircle}>
            <MaterialIcons name={a.icon as any} size={22} color={theme.colors.primary} />
          </View>
          <Text style={styles.quickLabel}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["announcements"],
    queryFn: listAnnouncements,
    staleTime: 60_000,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AppHeader title="MyNivas" />
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.greetingBox}>
              <Text style={styles.greetingText}>{greeting()}, {user?.name?.split(" ")[0] ?? "Resident"} 👋</Text>
              <Text style={styles.greetingSubtext}>What do you need help with today?</Text>
            </View>
            <QuickActionRow userId={user?.id ?? ""} />
            <Text style={styles.feedTitle}>Community Announcements</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <AnnouncementCard item={item} userId={user?.id ?? ""} />
        )}
        ListEmptyComponent={() =>
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📢</Text>
              <Text style={styles.emptyText}>No announcements yet</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  greetingBox: { marginBottom: theme.spacing.lg },
  greetingText: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  greetingSubtext: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
  quickRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: theme.spacing.xl },
  quickItem: { alignItems: "center", flex: 1 },
  quickCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#EBF5FB", justifyContent: "center", alignItems: "center", marginBottom: theme.spacing.xs, borderWidth: 1, borderColor: theme.colors.primary + "33" },
  quickLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: "500" },
  feedTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
  card: { borderRadius: theme.borderRadius.lg, borderWidth: 1.5, padding: theme.spacing.md, marginBottom: theme.spacing.md, ...theme.shadow.sm },
  emergencyBanner: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: theme.spacing.sm },
  emergencyText: { fontSize: 11, fontWeight: "700", color: theme.colors.danger, letterSpacing: 0.5 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spacing.sm, gap: theme.spacing.sm },
  cardTitle: { flex: 1, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  cardBody: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 20 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing.sm },
  cardTime: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled },
  pollBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  pollBtnText: { fontSize: theme.fontSize.xs, color: theme.colors.primary, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: theme.spacing.xxxl },
  emptyEmoji: { fontSize: 40, marginBottom: theme.spacing.md },
  emptyText: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
});
