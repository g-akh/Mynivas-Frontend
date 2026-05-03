/**
 * Resident — Document Library
 * GET /v1/documents/categories
 * GET /v1/documents?my_unit=
 * GET /v1/documents/:id/download → opens signed URL
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Linking, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../../../../src/components/common/AppHeader";
import EmptyState from "../../../../src/components/common/EmptyState";
import { SkeletonList } from "../../../../src/components/common/SkeletonLoader";
import { useCategoryList, useDocumentList } from "../../../../src/hooks/useDocuments";
import { getDownloadUrl, getMimeTypeIcon, getMimeTypeColor } from "../../../../src/api/documents";
import { useAuthStore } from "../../../../src/store/auth.store";
import { showToast } from "../../../../src/store/ui.store";
import { formatDate, formatFileSize } from "../../../../src/utils/format";
import { theme } from "../../../../src/theme";
import type { Document } from "../../../../src/types";

export default function DocumentLibraryScreen() {
  const { user } = useAuthStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: categories = [], isLoading: catsLoading } = useCategoryList();
  const { data: documents = [], isLoading: docsLoading } = useDocumentList({
    category_id: selectedCategoryId ?? undefined,
    my_unit: user?.id,
  });

  const filtered = documents.filter(d =>
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = async (doc: Document) => {
    setDownloadingId(doc.id);
    try {
      const { url } = await getDownloadUrl(doc.id);
      await Linking.openURL(url);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 410) {
        showToast({ type: "error", message: "This document has expired." });
      } else if (status === 403) {
        showToast({ type: "error", message: "You don't have permission to access this document." });
      } else {
        showToast({ type: "error", message: "Could not open document. Try again." });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Documents" showBack />

      {/* Search bar */}
      <View style={s.searchContainer}>
        <MaterialIcons name="search" size={18} color={theme.colors.textSecondary} />
        <TextInput
          style={s.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search documents..."
          placeholderTextColor={theme.colors.textDisabled}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialIcons name="close" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      {!catsLoading && categories.length > 0 && (
        <View style={s.categoryRow}>
          <TouchableOpacity
            style={[s.catChip, selectedCategoryId === null && s.catChipActive]}
            onPress={() => setSelectedCategoryId(null)}
          >
            <Text style={[s.catChipText, selectedCategoryId === null && s.catChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[s.catChip, selectedCategoryId === cat.id && s.catChipActive]}
              onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
            >
              <Text style={[s.catChipText, selectedCategoryId === cat.id && s.catChipTextActive]} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Document list */}
      {docsLoading ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={d => d.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              emoji="📁"
              title="No documents found"
              subtitle={searchQuery ? "Try a different search term" : "No documents available in this category"}
            />
          }
          renderItem={({ item }) => {
            const iconName = getMimeTypeIcon(item.mime_type);
            const iconColor = getMimeTypeColor(item.mime_type);
            const isDownloading = downloadingId === item.id;
            return (
              <TouchableOpacity style={s.docCard} onPress={() => handleDownload(item)} activeOpacity={0.75}>
                <View style={[s.fileIcon, { backgroundColor: iconColor + "18" }]}>
                  {isDownloading ? (
                    <ActivityIndicator size="small" color={iconColor} />
                  ) : (
                    <MaterialIcons name={iconName as any} size={24} color={iconColor} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.docName} numberOfLines={2}>{item.name}</Text>
                  <View style={s.docMeta}>
                    <Text style={s.docMetaText}>{formatFileSize(item.size_bytes)}</Text>
                    <Text style={s.docMetaDot}>·</Text>
                    <Text style={s.docMetaText}>{formatDate(item.created_at)}</Text>
                    {item.expires_at && (
                      <>
                        <Text style={s.docMetaDot}>·</Text>
                        <Text style={[s.docMetaText, { color: theme.colors.warning }]}>
                          Expires {formatDate(item.expires_at)}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <MaterialIcons name="download" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  searchContainer: { flexDirection: "row", alignItems: "center", gap: 8, margin: 12, paddingHorizontal: 14, height: 44, backgroundColor: theme.colors.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
  searchInput: { flex: 1, fontSize: 14, color: theme.colors.textPrimary },
  categoryRow: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 8, gap: 8, flexWrap: "nowrap" },
  catChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  catChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  catChipText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "500" },
  catChipTextActive: { color: "#fff" },
  docCard: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, gap: 12, ...theme.shadow.sm },
  fileIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  docName: { fontSize: 14, fontWeight: "600", color: theme.colors.textPrimary, marginBottom: 4, lineHeight: 18 },
  docMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  docMetaText: { fontSize: 11, color: theme.colors.textSecondary },
  docMetaDot: { fontSize: 11, color: theme.colors.textDisabled },
});
