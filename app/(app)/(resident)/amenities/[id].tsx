/**
 * Amenity Detail + Availability Calendar + Booking
 * GET /v1/amenities/:id/availability?from=&to=
 * POST /v1/amenities/bookings
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../../src/components/common/AppHeader";
import LoadingButton from "../../../../src/components/common/LoadingButton";
import StatusBadge from "../../../../src/components/common/StatusBadge";
import { getAmenity, getAvailability, createBooking } from "../../../../src/api/amenities";
import { useAuthStore } from "../../../../src/store/auth.store";
import { showToast } from "../../../../src/store/ui.store";
import { getErrorMessage } from "../../../../src/api/client";
import { theme } from "../../../../src/theme";
import dayjs from "dayjs";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AmenityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const today = dayjs().format("YYYY-MM-DD");
  const twoWeeks = dayjs().add(13, "day").format("YYYY-MM-DD");

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState("");
  const [notes, setNotes] = useState("");
  const [showBookModal, setShowBookModal] = useState(false);

  const { data: amenity, isLoading: amenityLoading } = useQuery({
    queryKey: ["amenity", id],
    queryFn: () => getAmenity(id!),
    enabled: !!id,
  });

  const { data: availability = [], isLoading: availLoading } = useQuery({
    queryKey: ["availability", id, today, twoWeeks],
    queryFn: () => getAvailability(id!, today, twoWeeks),
    enabled: !!id,
    staleTime: 60_000,
  });

  const bookMutation = useMutation({
    mutationFn: () => createBooking({ amenityId: id!, slotId: selectedSlotId!, unitId, date: selectedDate!, notes }),
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      setShowBookModal(false);
      const msg = booking.status === "CONFIRMED"
        ? "Booking confirmed! ✓"
        : "Booking request submitted. Awaiting approval.";
      showToast({ type: "success", message: msg });
      router.back();
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      if (status === 409) {
        showToast({ type: "error", message: "This slot is fully booked. Please choose another." });
      } else {
        showToast({ type: "error", message: getErrorMessage(err) });
      }
    },
  });

  if (amenityLoading) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <AppHeader title="Amenity" showBack />
        <View style={s.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      </SafeAreaView>
    );
  }
  if (!amenity) return null;

  const selectedDay = availability.find(d => d.date === selectedDate);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title={amenity.name} showBack />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Amenity Info */}
        <View style={s.infoCard}>
          <Text style={s.amenityName}>{amenity.name}</Text>
          {amenity.location ? (
            <View style={s.row}><MaterialIcons name="location-on" size={14} color={theme.colors.textSecondary} /><Text style={s.infoText}>{amenity.location}</Text></View>
          ) : null}
          <View style={s.row}>
            <MaterialIcons name="people" size={14} color={theme.colors.textSecondary} />
            <Text style={s.infoText}>Capacity: {amenity.capacity}</Text>
          </View>
          {amenity.requires_approval ? (
            <View style={s.approvalBanner}>
              <MaterialIcons name="info" size={14} color={theme.colors.warning} />
              <Text style={s.approvalText}>This amenity requires approval. Your booking will be reviewed by the facility manager.</Text>
            </View>
          ) : null}
        </View>

        {/* Calendar — next 14 days */}
        <Text style={s.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}>
            {availability.map(day => {
              const hasSlots = day.slots.some(sl => sl.available);
              const isSelected = selectedDate === day.date;
              const d = dayjs(day.date);
              return (
                <TouchableOpacity
                  key={day.date}
                  style={[s.dayChip, isSelected && s.dayChipSelected, !hasSlots && s.dayChipFull]}
                  onPress={() => { setSelectedDate(day.date); setSelectedSlotId(null); }}
                  disabled={!hasSlots}
                >
                  <Text style={[s.dayName, isSelected && s.dayTextSel]}>{DAY_NAMES[d.day()]}</Text>
                  <Text style={[s.dayNum, isSelected && s.dayTextSel]}>{d.format("D")}</Text>
                  {!hasSlots ? <Text style={s.fullLabel}>Full</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Slots for selected date */}
        {selectedDate && selectedDay ? (
          <>
            <Text style={s.sectionTitle}>Available Slots — {dayjs(selectedDate).format("DD MMM")}</Text>
            <View style={{ gap: 10, marginBottom: 16 }}>
              {selectedDay.slots.map(slot => (
                <TouchableOpacity
                  key={slot.slot_id}
                  style={[s.slotCard, selectedSlotId === slot.slot_id && s.slotSelected, !slot.available && s.slotFull]}
                  onPress={() => slot.available && setSelectedSlotId(slot.slot_id)}
                  disabled={!slot.available}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.slotTime, selectedSlotId === slot.slot_id && s.slotTimeSelected]}>
                      {slot.start_time} – {slot.end_time}
                    </Text>
                    <Text style={s.slotCap}>{slot.available_capacity} spots left</Text>
                  </View>
                  {selectedSlotId === slot.slot_id && <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />}
                  {!slot.available && <Text style={s.slotFullLabel}>Full</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          availLoading ? (
            <View style={s.centered}><ActivityIndicator color={theme.colors.primary} /></View>
          ) : (
            <View style={s.centered}><Text style={{ color: theme.colors.textSecondary }}>Select a date above to see available slots</Text></View>
          )
        )}

        {selectedDate && selectedSlotId && (
          <LoadingButton
            title="Continue to Book"
            onPress={() => setShowBookModal(true)}
            isLoading={false}
            style={{ marginTop: 8 }}
          />
        )}
      </ScrollView>

      {/* Booking Confirmation Modal */}
      <Modal visible={showBookModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={s.modalHdr}>
            <Text style={s.modalTitle}>Confirm Booking</Text>
            <TouchableOpacity onPress={() => setShowBookModal(false)}>
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={s.summaryCard}>
              <Text style={s.summaryRow}><Text style={s.summaryLabel}>Amenity: </Text>{amenity.name}</Text>
              <Text style={s.summaryRow}><Text style={s.summaryLabel}>Date: </Text>{dayjs(selectedDate!).format("DD MMM YYYY")}</Text>
              <Text style={s.summaryRow}><Text style={s.summaryLabel}>Slot: </Text>{selectedDay?.slots.find(sl => sl.slot_id === selectedSlotId)?.start_time} – {selectedDay?.slots.find(sl => sl.slot_id === selectedSlotId)?.end_time}</Text>
            </View>
            <Text style={s.fieldLabel}>Your Unit ID *</Text>
            <TextInput style={s.input} value={unitId} onChangeText={setUnitId} placeholder="e.g. A-101 unit UUID" placeholderTextColor={theme.colors.textDisabled} />
            <Text style={s.fieldLabel}>Notes (optional)</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: "top" }]} value={notes} onChangeText={setNotes} placeholder="Any special requests?" placeholderTextColor={theme.colors.textDisabled} multiline />
            {amenity.requires_approval ? (
              <View style={s.approvalBanner}><MaterialIcons name="info" size={14} color={theme.colors.warning} /><Text style={s.approvalText}>Booking requires approval — you will be notified.</Text></View>
            ) : null}
            <LoadingButton
              title={amenity.requires_approval ? "Request Booking" : "Confirm Booking"}
              loadingTitle="Booking…"
              onPress={() => bookMutation.mutate()}
              isLoading={bookMutation.isPending}
              disabled={!unitId.trim()}
              style={{ marginTop: 24 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  infoCard: { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow.sm },
  amenityName: { fontSize: 20, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  infoText: { fontSize: 13, color: theme.colors.textSecondary },
  approvalBanner: { flexDirection: "row", gap: 8, marginTop: 10, backgroundColor: theme.colors.warning + "15", padding: 10, borderRadius: 8, alignItems: "flex-start" },
  approvalText: { flex: 1, fontSize: 12, color: theme.colors.warning, lineHeight: 17 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  dayChip: { width: 52, height: 64, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
  dayChipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  dayChipFull: { opacity: 0.4 },
  dayName: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: "500" },
  dayNum: { fontSize: 18, fontWeight: "700", color: theme.colors.textPrimary },
  dayTextSel: { color: "#fff" },
  fullLabel: { fontSize: 9, color: theme.colors.danger, fontWeight: "600" },
  slotCard: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: theme.colors.border },
  slotSelected: { borderColor: theme.colors.primary, backgroundColor: "#EBF5FB" },
  slotFull: { opacity: 0.4 },
  slotTime: { fontSize: 15, fontWeight: "600", color: theme.colors.textPrimary },
  slotTimeSelected: { color: theme.colors.primary },
  slotCap: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  slotFullLabel: { fontSize: 11, color: theme.colors.danger, fontWeight: "600" },
  modalHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modalTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.textPrimary },
  summaryCard: { backgroundColor: "#EBF5FB", borderRadius: 10, padding: 14, marginBottom: 20, gap: 6 },
  summaryRow: { fontSize: 14, color: theme.colors.textPrimary, lineHeight: 20 },
  summaryLabel: { fontWeight: "600" },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: theme.colors.textPrimary, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface, marginBottom: 16 },
});
