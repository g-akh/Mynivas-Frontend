/**
 * Notification Center — Phase 18
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../src/components/common/AppHeader";
import EmptyState from "../../src/components/common/EmptyState";
import { useUIStore } from "../../src/store/ui.store";
import { theme } from "../../src/theme";
import { formatRelative } from "../../src/utils/format";

const TYPE_ICON: Record<string, string> = {
  COMPLAINT: "report-problem",
  VISITOR: "person",
  WORK_ORDER: "build",
  ANNOUNCEMENT: "campaign",
  BILLING: "receipt",
  BOOKING: "event-seat",
  DEFAULT: "notifications",
};

const TYPE_COLOR: Record<string, string> = {
  COMPLAINT: "#E74C3C",
  VISITOR: "#3498DB",
  WORK_ORDER: "#9B59B6",
  ANNOUNCEMENT: "#F39C12",
  BILLING: "#27AE60",
  BOOKING: "#2980B9",
  DEFAULT: theme.colors.primary,
};

function NotifItem({ item }: { item: any }) {
  const icon = TYPE_ICON[item.type] ?? TYPE_ICON.DEFAULT;
  const color = TYPE_COLOR[item.type] ?? TYPE_COLOR.DEFAULT;

  return (
    <View style={[s.item, !item.read && s.unreadItem]}>
      {!item.read && <View style={s.unreadDot} />}
      <View style={[s.iconBox, { backgroundColor: color + "18" }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <View style={s.content}>
        <Text style={[s.title, !item.read && s.titleBold]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={s.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={s.time}>{formatRelative(item.receivedAt)}</Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const { notifications, markAllRead, unreadCount } = useUIStore();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Notifications" showBack showNotifications={false} showProfile={false} />

      {unreadCount > 0 && (
        <View style={s.topBar}>
          <Text style={s.unreadCount}>{unreadCount} unread</Text>
          <TouchableOpacity onPress={markAllRead} style={s.markAllBtn}>
            <MaterialIcons name="done-all" size={16} color={theme.colors.primary} />
            <Text style={s.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotifItem item={item} />}
        ListEmptyComponent={
          <EmptyState
            emoji="🔔"
            title="No notifications"
            subtitle="You're all caught up! Notifications will appear here."
          />
        }
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={() => <View style={s.separator} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  unreadCount: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  markAllText: { fontSize: theme.fontSize.sm, color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },
  listContent: { paddingBottom: theme.spacing.xxl },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    position: "relative",
  },
  unreadItem: { backgroundColor: theme.colors.primary + "05" },
  unreadDot: {
    position: "absolute",
    top: 18,
    left: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.primary,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  content: { flex: 1 },
  title: { fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, marginBottom: 2 },
  titleBold: { fontWeight: theme.fontWeight.semibold },
  body: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 18 },
  time: { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled, marginTop: 4 },
  separator: { height: 1, backgroundColor: theme.colors.border },
});
