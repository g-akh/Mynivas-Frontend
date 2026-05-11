/**
 * Resident Notices — Community announcements feed
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ScrollView,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { listAnnouncements, acknowledgeAnnouncement } from "../../../src/api/announcements";
import { useAuthStore } from "../../../src/store/auth.store";
import { showToast } from "../../../src/store/ui.store";
import { formatRelative } from "../../../src/utils/format";
import { theme } from "../../../src/theme";
import type { Announcement, AnnouncementPriority, AnnouncementType } from "../../../src/types";

/* ─── Filter config ─────────────────────────────────────────────────── */
type FilterKey = "ALL" | "NOTICE" | "POLL" | "IMPORTANT" | "URGENT";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL",       label: "All"       },
  { key: "NOTICE",    label: "Notice"    },
  { key: "POLL",      label: "Poll"      },
  { key: "IMPORTANT", label: "Important" },
  { key: "URGENT",    label: "Urgent"    },
];

function matchesFilter(item: Announcement, filter: FilterKey): boolean {
  if (filter === "ALL")       return true;
  if (filter === "NOTICE")    return item.type === "NOTICE" && item.priority === "NORMAL";
  if (filter === "POLL")      return item.type === "POLL";
  if (filter === "IMPORTANT") return item.priority === "IMPORTANT";
  if (filter === "URGENT")    return item.priority === "EMERGENCY";
  return true;
}

/* ─── Tag chip config ───────────────────────────────────────────────── */
const TAG_COLOR: Record<string, string> = {
  NOTICE:    "#E3F2FD",
  POLL:      "#E8F5E9",
  EMERGENCY: "#FFEBEE",
  NORMAL:    "#E3F2FD",
  IMPORTANT: "#FFF8E1",
};
const TAG_TEXT: Record<string, string> = {
  NOTICE:    "#1565C0",
  POLL:      "#2E7D32",
  EMERGENCY: "#C62828",
  NORMAL:    "#1565C0",
  IMPORTANT: "#E65100",
};
const TAG_LABEL: Record<string, string> = {
  NOTICE:    "Notice",
  POLL:      "Poll",
  EMERGENCY: "Urgent",
};
const PRIORITY_LABEL: Record<AnnouncementPriority, string> = {
  NORMAL:    "Notice",
  IMPORTANT: "Important",
  EMERGENCY: "Urgent",
};

/* ─── Notice Card ───────────────────────────────────────────────────── */
function NoticeCard({ item, userId }: { item: Announcement; userId: string }) {
  const qc = useQueryClient();
  const { mutate: ack, isPending } = useMutation({
    mutationFn: () => acknowledgeAnnouncement(item.id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      showToast({ type: "success", message: "Acknowledged!" });
    },
  });

  const isUrgent  = item.priority === "EMERGENCY";
  const tagBg     = isUrgent ? TAG_COLOR["EMERGENCY"]  : TAG_COLOR[item.type]     ?? TAG_COLOR["NOTICE"];
  const tagTxt    = isUrgent ? TAG_TEXT["EMERGENCY"]   : TAG_TEXT[item.type]      ?? TAG_TEXT["NOTICE"];
  const tagLabel  = isUrgent ? "Urgent" : (TAG_LABEL[item.type] ?? "Notice");
  const iconColor = isUrgent ? "#E53935" : theme.colors.primary;
  const iconBg    = isUrgent ? "#FFEBEE" : theme.colors.primaryLight + "22";

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.85}
      onPress={() => { if (item.required_ack) ack(); }}
    >
      {/* Left icon */}
      <View style={[s.cardIcon, { backgroundColor: iconBg }]}>
        <MaterialIcons
          name={isUrgent ? "warning" : "campaign"}
          size={22}
          color={iconColor}
        />
      </View>

      {/* Body */}
      <View style={s.cardContent}>
        {/* Title row */}
        <View style={s.cardTitleRow}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
          {item.required_ack && (
            <View style={s.pinnedBadge}>
              <MaterialIcons name="push-pin" size={11} color="#1565C0" />
              <Text style={s.pinnedText}>Pinned</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={s.cardDesc} numberOfLines={2}>{item.body}</Text>

        {/* Footer: tag + time */}
        <View style={s.cardFooter}>
          <View style={[s.tagChip, { backgroundColor: tagBg }]}>
            <Text style={[s.tagText, { color: tagTxt }]}>{tagLabel}</Text>
          </View>
          <Text style={s.cardTime}>{formatRelative(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────────── */
export default function NoticesScreen() {
  const { user } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["announcements"],
    queryFn: listAnnouncements,
    staleTime: 60_000,
  });

  const filtered = data.filter((item) => matchesFilter(item, activeFilter));
  const activeCount = data.filter((i) => i.status === "SENT").length;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* ── Gradient Header ─────────────────────────────────────── */}
      <LinearGradient
        colors={["#0D2766", "#1565C0", "#1976D2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <Text style={s.headerSub}>Stay informed</Text>
        <Text style={s.headerTitle}>
          {isLoading ? "Loading…" : `${activeCount || data.length} active notices`}
        </Text>
      </LinearGradient>

      {/* ── Filter Chips ────────────────────────────────────────── */}
      <View style={s.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {FILTERS.map(({ key, label }) => {
            const active = activeFilter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[s.chip, active && s.chipActive]}
                onPress={() => setActiveFilter(key)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Notice List ─────────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item }) => (
          <NoticeCard item={item} userId={user?.id ?? ""} />
        )}
        ListEmptyComponent={() =>
          !isLoading ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <MaterialIcons name="campaign" size={36} color={theme.colors.primary} />
              </View>
              <Text style={s.emptyTitle}>No notices</Text>
              <Text style={s.emptyDesc}>
                {activeFilter === "ALL"
                  ? "Community announcements will appear here."
                  : "No notices match this filter."}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={s.listContent}
      />
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },

  /* Header */
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  headerSub:   { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "500", marginBottom: 4 },
  headerTitle: { fontSize: 28, color: "#FFFFFF", fontWeight: "800", letterSpacing: -0.3 },

  /* Filter */
  filterWrap: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  chipText:       { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary },
  chipTextActive: { color: "#FFFFFF" },

  /* List */
  listContent: { padding: 16, paddingBottom: 40, gap: 12 },

  /* Card */
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16, padding: 16,
    flexDirection: "row", gap: 14,
    borderWidth: 1, borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  cardIcon: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 4 },
  cardTitle: {
    flex: 1, fontSize: 16, fontWeight: "700",
    color: theme.colors.textPrimary, letterSpacing: -0.1,
  },
  pinnedBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, flexShrink: 0,
  },
  pinnedText: { fontSize: 11, fontWeight: "700", color: theme.colors.primary },
  cardDesc:   { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19, marginBottom: 10 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 10 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: "600" },
  cardTime: { fontSize: 12, color: theme.colors.textDisabled },

  /* Empty */
  empty:      { alignItems: "center", paddingTop: 60 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: theme.colors.primary + "14",
    justifyContent: "center", alignItems: "center", marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.textPrimary },
  emptyDesc:  { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: "center", lineHeight: 19 },
});
