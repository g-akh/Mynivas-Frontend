import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { theme } from "../../theme";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  visible, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  destructive = false, isLoading = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onCancel} disabled={isLoading}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirm, destructive ? styles.destructive : null]}
              onPress={onConfirm} disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.confirmText}>{confirmLabel}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  dialog: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, margin: theme.spacing.xl, width: "85%", ...theme.shadow.lg },
  title: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  message: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: theme.spacing.xl },
  actions: { flexDirection: "row", gap: theme.spacing.md },
  btn: { flex: 1, height: 44, borderRadius: theme.borderRadius.md, justifyContent: "center", alignItems: "center" },
  cancel: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
  confirm: { backgroundColor: theme.colors.primary },
  destructive: { backgroundColor: theme.colors.danger },
  cancelText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  confirmText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: "#fff" },
});
