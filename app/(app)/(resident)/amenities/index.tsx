/**
 * Resident — Browse Amenities
 * GET /v1/amenities?community_id=
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../../src/components/common/AppHeader";
import EmptyState from "../../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../../src/components/common/SkeletonLoader";
import { useAmenityList } from "../../../../src/hooks/useAmenities";
import { useAuthStore } from "../../../../src/store/auth.store";
import { theme } from "../../../../src/theme";
import type { Amenity } from "../../../../src/types";

function AmenityCard({ item }: { item: Amenity }) {
  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push({ pathname: "/(app)/(resident)/amenities/[id]", params: { id: item.id } } as any)}
      activeOpacity={0.8}
    >
      <View style={s.iconBox}>
        <MaterialIcons name="sports-gymnastics" size={28} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.name}>{item.name}</Text>
        {item.location ? <Text style={s.location}>📍 {item.location}</Text> : null}
        <View style={s.meta}>
          <View style={s.chip}>
            <MaterialIcons name="people" size={12} color={theme.colors.textSecondary} />
            <Text style={s.chipText}>Capacity: {item.capacity}</Text>
          </View>
          {item.requires_approval ? (
            <View style={[s.chip, s.approvalChip]}>
              <MaterialIcons name="approval" size={12} color={theme.colors.warning} />
              <Text style={[s.chipText, { color: theme.colors.warning }]}>Approval needed</Text>
            </View>
          ) : (
            <View style={[s.chip, s.instantChip]}>
              <MaterialIcons name="flash-on" size={12} color={theme.colors.success} />
              <Text style={[s.chipText, { color: theme.colors.success }]}>Instant booking</Text>
            </View>
          )}
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={theme.colors.textDisabled} />
    </TouchableOpacity>
  );
}

export default function AmenitiesScreen() {
  const { user } = useAuthStore();
  const { data = [], isLoading, refetch } = useAmenityList(user?.communityId ?? "");

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Amenities" showBack />
      {isLoading ? <SkeletonList /> : (
        <FlatList
          data={data}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <AmenityCard item={item} />}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={theme.colors.primary} />}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListHeaderComponent={<Text style={s.sectionTitle}>{data.length} amenities available</Text>}
          ListEmptyComponent={<EmptyState emoji="🏊" title="No amenities available" subtitle="No amenities have been set up for your community yet" />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  sectionTitle: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 12, fontWeight: "500" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border, gap: 12, ...theme.shadow.sm },
  iconBox: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#EBF5FB", justifyContent: "center", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 3 },
  location: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8 },
  meta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.colors.background, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
  chipText: { fontSize: 11, color: theme.colors.textSecondary },
  approvalChip: { borderColor: theme.colors.warning + "44", backgroundColor: theme.colors.warning + "11" },
  instantChip: { borderColor: theme.colors.success + "44", backgroundColor: theme.colors.success + "11" },
});
