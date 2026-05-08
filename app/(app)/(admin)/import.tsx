/**
 * Admin — Excel Bulk Import
 * Step 1: Upload (pick file + download template)
 * Step 2: Preview  (dry-run validation report, confirm or cancel)
 * Step 3: Result   (success summary + warnings)
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import AppHeader from "../../../src/components/common/AppHeader";
import LoadingButton from "../../../src/components/common/LoadingButton";
import { previewImport, runImport, getImportTemplateUrl, ImportResult, ImportRowError } from "../../../src/api/admin";
import { showToast } from "../../../src/store/ui.store";
import { theme } from "../../../src/theme";

type Step = "UPLOAD" | "PREVIEW" | "RESULT";

// ─── small components ────────────────────────────────────────────────────────

function SummaryRow({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={s.summaryRow}>
      <View style={[s.summaryIcon, { backgroundColor: color + "18" }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={[s.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

function ErrorList({ items, title, color }: { items: ImportRowError[]; title: string; color: string }) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const shown = expanded ? items : items.slice(0, 3);
  return (
    <View style={[s.issueBox, { borderColor: color + "44" }]}>
      <TouchableOpacity style={s.issueHeader} onPress={() => setExpanded(!expanded)}>
        <MaterialIcons name={color === theme.colors.danger ? "error-outline" : "warning-amber"} size={16} color={color} />
        <Text style={[s.issueTitle, { color }]}>{title} ({items.length})</Text>
        <MaterialIcons name={expanded ? "expand-less" : "expand-more"} size={18} color={color} />
      </TouchableOpacity>
      {shown.map((e, i) => (
        <Text key={i} style={[s.issueRow, { color: theme.colors.textSecondary }]}>
          • Sheet "{e.sheet}", row {e.row}: {e.message}
        </Text>
      ))}
      {!expanded && items.length > 3 && (
        <TouchableOpacity onPress={() => setExpanded(true)}>
          <Text style={[s.issueMore, { color }]}>+{items.length - 3} more — tap to expand</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export default function AdminImportScreen() {
  const [step, setStep]           = useState<Step>("UPLOAD");
  const [fileUri, setFileUri]     = useState<string | null>(null);
  const [fileName, setFileName]   = useState<string>("");
  const [preview, setPreview]     = useState<ImportResult | null>(null);
  const [result, setResult]       = useState<ImportResult | null>(null);
  const [loading, setLoading]     = useState(false);

  // Step 1 — pick file
  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      setFileUri(asset.uri);
      setFileName(asset.name ?? "import.xlsx");
    } catch {
      showToast({ type: "error", message: "Could not open file picker" });
    }
  };

  // Step 1 → Step 2 — dry-run preview
  const handlePreview = async () => {
    if (!fileUri) {
      showToast({ type: "error", message: "Please select an Excel file first" });
      return;
    }
    setLoading(true);
    try {
      const data = await previewImport(fileUri, fileName);
      setPreview(data);
      setStep("PREVIEW");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Preview failed — check the file format";
      showToast({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → Step 3 — real import
  const handleImport = async () => {
    if (!fileUri) return;
    Alert.alert(
      "Confirm Import",
      "This will insert all valid rows into the database. Duplicates will be skipped. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import Now",
          style: "default",
          onPress: async () => {
            setLoading(true);
            try {
              const data = await runImport(fileUri, fileName);
              setResult(data);
              setStep("RESULT");
            } catch (err: any) {
              const msg = err?.response?.data?.error ?? "Import failed";
              showToast({ type: "error", message: msg });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReset = () => {
    setStep("UPLOAD");
    setFileUri(null);
    setFileName("");
    setPreview(null);
    setResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const url = await getImportTemplateUrl();
      await Linking.openURL(url);
    } catch {
      showToast({ type: "error", message: "Could not open template URL" });
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <AppHeader title="Bulk Import" />

      {/* Step indicator */}
      <View style={s.stepper}>
        {(["UPLOAD", "PREVIEW", "RESULT"] as Step[]).map((st, idx) => {
          const done   = (step === "PREVIEW" && st === "UPLOAD") || (step === "RESULT" && st !== "RESULT");
          const active = step === st;
          return (
            <React.Fragment key={st}>
              <View style={[s.stepCircle, active && s.stepActive, done && s.stepDone]}>
                {done
                  ? <MaterialIcons name="check" size={14} color="#fff" />
                  : <Text style={[s.stepNum, active && { color: "#fff" }]}>{idx + 1}</Text>
                }
              </View>
              {idx < 2 && <View style={[s.stepLine, (done || active) && s.stepLineDone]} />}
            </React.Fragment>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {/* ── STEP 1: UPLOAD ─────────────────────────────────────────────── */}
        {step === "UPLOAD" && (
          <View>
            <Text style={s.sectionTitle}>1. Download the template</Text>
            <TouchableOpacity style={s.templateBtn} onPress={handleDownloadTemplate}>
              <MaterialIcons name="download" size={20} color={theme.colors.primary} />
              <Text style={s.templateBtnText}>Download Template (.xlsx)</Text>
            </TouchableOpacity>
            <Text style={s.hint}>
              Fill in the 4 sheets: <Text style={s.bold}>Buildings, Units, Residents, Staff</Text>.{"\n"}
              Don't rename the sheets or remove the header row.
            </Text>

            <Text style={[s.sectionTitle, { marginTop: theme.spacing.xl }]}>2. Upload the filled file</Text>
            <TouchableOpacity style={[s.uploadBox, fileUri && s.uploadBoxSelected]} onPress={handlePickFile}>
              <MaterialIcons
                name={fileUri ? "insert-drive-file" : "upload-file"}
                size={36}
                color={fileUri ? theme.colors.success : theme.colors.primary}
              />
              <Text style={[s.uploadLabel, fileUri && { color: theme.colors.success }]}>
                {fileUri ? fileName : "Tap to choose .xlsx from device"}
              </Text>
              {fileUri && (
                <TouchableOpacity onPress={() => { setFileUri(null); setFileName(""); }} style={s.clearBtn}>
                  <MaterialIcons name="close" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <LoadingButton
              title="Preview Import"
              loadingTitle="Validating…"
              onPress={handlePreview}
              isLoading={loading}
              style={{ marginTop: theme.spacing.lg }}
            />
          </View>
        )}

        {/* ── STEP 2: PREVIEW ────────────────────────────────────────────── */}
        {step === "PREVIEW" && preview && (
          <View>
            <Text style={s.sectionTitle}>Validation Report</Text>
            <Text style={s.hint}>Review what will be imported. Fix errors in the file and re-upload if needed.</Text>

            <View style={s.card}>
              <SummaryRow icon="business"        label="Buildings"    value={preview.summary.buildings.willInsert ?? 0}   color={theme.colors.primary} />
              <SummaryRow icon="door-front"      label="Units"        value={preview.summary.units.willInsert ?? 0}        color="#8E44AD" />
              <SummaryRow icon="people"          label="Users"        value={preview.summary.users.willInsert ?? 0}        color="#27AE60" />
              <SummaryRow icon="home-work"       label="Assignments"  value={preview.summary.assignments.willInsert ?? 0}  color="#E67E22" />
            </View>

            <ErrorList items={preview.errors}   title="Errors (rows that will be skipped)" color={theme.colors.danger} />
            <ErrorList items={preview.warnings} title="Warnings"                           color={theme.colors.warning} />

            {preview.errors.length > 0 && (
              <View style={s.errorBanner}>
                <MaterialIcons name="error-outline" size={18} color={theme.colors.danger} />
                <Text style={s.errorBannerText}>
                  {preview.errors.length} error(s) found. Fix them in the file and re-upload to include those rows.
                  You can still import the valid rows.
                </Text>
              </View>
            )}

            <View style={s.actionRow}>
              <TouchableOpacity style={s.cancelBtn} onPress={handleReset} disabled={loading}>
                <Text style={s.cancelBtnText}>← Back</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <LoadingButton
                  title={`Import ${(preview.summary.users.willInsert ?? 0) + (preview.summary.buildings.willInsert ?? 0)} rows`}
                  loadingTitle="Importing…"
                  onPress={handleImport}
                  isLoading={loading}
                />
              </View>
            </View>
          </View>
        )}

        {/* ── STEP 3: RESULT ─────────────────────────────────────────────── */}
        {step === "RESULT" && result && (
          <View style={s.resultContainer}>
            <View style={s.successIcon}>
              <MaterialIcons name="check-circle" size={56} color={theme.colors.success} />
            </View>
            <Text style={s.resultTitle}>Import Complete</Text>

            <View style={s.card}>
              <SummaryRow icon="business"   label="Buildings inserted"    value={result.summary.buildings.inserted ?? 0}   color={theme.colors.primary} />
              <SummaryRow icon="door-front" label="Units inserted"        value={result.summary.units.inserted ?? 0}        color="#8E44AD" />
              <SummaryRow icon="people"     label="Users created"         value={result.summary.users.inserted ?? 0}        color="#27AE60" />
              <SummaryRow icon="home-work"  label="Unit assignments"      value={result.summary.assignments.inserted ?? 0}  color="#E67E22" />
              <SummaryRow icon="skip-next"  label="Duplicates skipped"    value={(result.summary.users.skipped ?? 0) + (result.summary.units.skipped ?? 0) + (result.summary.buildings.skipped ?? 0)} color={theme.colors.textSecondary} />
            </View>

            <ErrorList items={result.warnings} title="Warnings" color={theme.colors.warning} />

            <TouchableOpacity style={s.doneBtn} onPress={handleReset}>
              <Text style={s.doneBtnText}>Import Another File</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {loading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={s.loadingText}>Processing…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },

  // stepper
  stepper: { flexDirection: "row", alignItems: "center", paddingHorizontal: 40, paddingVertical: 16, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: theme.colors.border, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.surface },
  stepActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  stepDone:   { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  stepNum:    { fontSize: 12, fontWeight: "700", color: theme.colors.textSecondary },
  stepLine:   { flex: 1, height: 2, backgroundColor: theme.colors.border, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: theme.colors.primary },

  sectionTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  hint: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: theme.spacing.md, lineHeight: 18 },
  bold: { fontWeight: "700", color: theme.colors.textPrimary },

  templateBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + "10", marginBottom: theme.spacing.sm },
  templateBtnText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.primary },

  uploadBox: { borderWidth: 2, borderColor: theme.colors.border, borderStyle: "dashed", borderRadius: theme.borderRadius.lg, padding: theme.spacing.xl, alignItems: "center", gap: 10, backgroundColor: theme.colors.surface, position: "relative" },
  uploadBoxSelected: { borderColor: theme.colors.success, backgroundColor: theme.colors.success + "08" },
  uploadLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, textAlign: "center" },
  clearBtn: { position: "absolute", top: 10, right: 10, padding: 4 },

  card: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, marginBottom: theme.spacing.md, ...theme.shadow.sm },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border + "80" },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  summaryLabel: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontWeight: theme.fontWeight.medium },
  summaryValue: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold },

  issueBox: { borderWidth: 1, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.md },
  issueHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: theme.spacing.sm },
  issueTitle: { flex: 1, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
  issueRow: { fontSize: 11, lineHeight: 18, marginBottom: 2 },
  issueMore: { fontSize: 11, fontWeight: "600", marginTop: 4 },

  errorBanner: { flexDirection: "row", gap: 8, backgroundColor: theme.colors.danger + "10", borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.danger + "44", padding: theme.spacing.md, marginBottom: theme.spacing.md },
  errorBannerText: { flex: 1, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 18 },

  actionRow: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: theme.spacing.sm },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border },
  cancelBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium },

  resultContainer: { alignItems: "center" },
  successIcon: { marginVertical: theme.spacing.lg },
  resultTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },

  doneBtn: { marginTop: theme.spacing.xl, paddingVertical: 14, paddingHorizontal: 40, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + "10" },
  doneBtnText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.primary },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: theme.fontSize.md, color: "#fff", fontWeight: theme.fontWeight.semibold },
});
