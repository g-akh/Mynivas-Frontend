/**
 * Resident Bookings — Phase 10
 * GET /v1/amenities/bookings | POST cancel
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
import AppHeader from "../../../src/components/common/AppHeader";
import StatusBadge from "../../../src/components/common/StatusBadge";
import EmptyState from "../../../src/components/common/EmptyState";
import ConfirmDialog from "../../../src/components/common/ConfirmDialog";
import { SkeletonList } from "../../../src/components/common/SkeletonLoader";
import { useBookingList, useCancelBooking } from "../../../src/hooks/useAmenities";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";
import { formatDate, formatRelative } from "../../../src/utils/format";
import type { Booking, BookingStatus } from "../../../src/types";

type Tab = "UPCOMING" | "PAST";

function isFutureBooking(booking: Booking): boolean {
  return new Date(booking.date) >= new Date(new Date().toDateString());
}

function isCancellable(booking: Booking): boolean {
  return (
    (booking.status === "PENDING" || booking.status === "CONFIRMED") &&
    isFutureBooking(booking)
  );
}

function BookingCard({
  item,
  onCancel,
}: {
  item: Booking;
  onCancel: (id: string) => void;
}) {
  const canCancel = isCancellable(item);

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.amenityRow}>
          <View style={s.amenityIcon}>
            <MaterialIcons name="event-seat" size={20} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={s.amenityId} numberOfLines={1}>
              Amenity #{item.amenity_id.slice(-6).toUpperCase()}
            </Text>
            <Text style={s.slotInfo}>Slot #{item.slot_id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>

      <View style={s.dateRow}>
        <MaterialIcons name="calendar-today" size={14} color={theme.colors.textSecondary} />
        <Text style={s.dateText}>{formatDate(item.date)}</Text>
      </View>

      {item.notes ? (
        <Text style={s.notesText} numberOfLines={2}>
          Notes: {item.notes}
        </Text>
      ) : null}

      {item.reject_reason ? (
        <Text style={s.rejectText}>
          Reason: {item.reject_reason}
        </Text>
      ) : null}

      <View style={s.cardFooter}>
        <Text style={s.timeText}>{formatRelative(item.created_at)}</Text>
        {canCancel && (
          <TouchableOpacity style={s.cancelBtn} onPress={() => onCancel(item.id)}>
            <MaterialIcons name="cancel" size={14} color={theme.colors.danger} />
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ResidentBookingsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("UPCOMING");
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: allBookings = [], isLoading, refetch } = useBookingList();
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();

  const upcomingBookings = allBookings.filter((b) => isFutureBooking(b));
  const pastBookings = allBookings.filter((b) => !isFutureBooking(b));
  const data = activeTab === "UPCOMING" ? upcomingBookings : pastBookings;

  const handleConfirmCancel = () => {
    if (!cancelId) return;
    cancelBooking(cancelId, {
      onSuccess: () => {
        showToast({ type: "success", message: "Booking cancelled" });
        setCancelId(null);
      },
      onError: () => {
        showToast({ type: "error", message: "Failed to cancel booking" });
        setCancelId(null);
      },
    });
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="My Bookings" />

      <View style={s.tabRow}>
        {(["UPCOMING", "PAST"] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          const count = tab === "UPCOMING" ? upcomingBookings.length : pastBookings.length;
          return (
            <TouchableOpacity
              key={tab}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, active && s.tabTextActive]}>{tab}</Text>
              {count > 0 && (
                <View style={[s.tabCount, active && s.tabCountActive]}>
                  <Text style={[s.tabCountText, active && s.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <BookingCard item={item} onCancel={(id) => setCancelId(id)} />
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="📅"
              title={activeTab === "UPCOMING" ? "No upcoming bookings" : "No past bookings"}
              subtitle="Book amenities from the amenities section."
            />
          }
          contentContainerStyle={s.listContent}
        />
      )}

      <ConfirmDialog
        visible={!!cancelId}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This cannot be undone."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep"
        destructive
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelId(null)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  tabRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1, flexDirection: "row", paddingVertical: 14,
    alignItems: "center", justifyContent: "center", gap: 6,
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabActive:        { borderBottomColor: theme.colors.primary },
  tabText:          { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.textSecondary },
  tabTextActive:    { color: theme.colors.primary, fontWeight: theme.fontWeight.bold },
  tabCount: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: theme.colors.border,
    justifyContent: "center", alignItems: "center", paddingHorizontal: 4,
  },
  tabCountActive:     { backgroundColor: theme.colors.primary + "22" },
  tabCountText:       { fontSize: 10, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold },
  tabCountTextActive: { color: theme.colors.primary },
  listContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  card: {
    backgroundColor: theme.colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: theme.colors.border,
    padding: theme.spacing.md, marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: theme.spacing.sm,
  },
  amenityRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  amenityIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: theme.colors.primary + "18",
    justifyContent: "center", alignItems: "center",
  },
  amenityId:  { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  slotInfo:   { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  dateRow:    { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: theme.spacing.sm },
  dateText:   { fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontWeight: theme.fontWeight.medium },
  notesText:  { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs },
  rejectText: { fontSize: theme.fontSize.xs, color: theme.colors.danger, marginBottom: theme.spacing.xs },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing.xs },
  timeText:   { fontSize: theme.fontSize.xs, color: theme.colors.textDisabled },
  cancelBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.danger + "12",
    borderWidth: 1, borderColor: theme.colors.danger + "44",
  },
  cancelBtnText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, color: theme.colors.danger },
});
