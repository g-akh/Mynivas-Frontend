import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";
import type { ComplaintPriority } from "../../types";

const PRIORITIES: { value: ComplaintPriority; label: string; icon: string }[] = [
  { value: "LOW",      label: "Low",      icon: "arrow-downward" },
  { value: "MEDIUM",   label: "Medium",   icon: "remove" },
  { value: "HIGH",     label: "High",     icon: "arrow-upward" },
  { value: "CRITICAL", label: "Critical", icon: "warning" },
];

interface PrioritySelectorProps {
  value: ComplaintPriority;
  onChange: (v: ComplaintPriority) => void;
  disabled?: boolean;
}

export default function PrioritySelector({ value, onChange, disabled }: PrioritySelectorProps) {
  return (
    <View style={styles.row}>
      {PRIORITIES.map((p) => {
        const color = theme.priority[p.value];
        const selected = value === p.value;
        return (
          <TouchableOpacity
            key={p.value}
            style={[
              styles.chip,
              { borderColor: color },
              selected ? { backgroundColor: color } : { backgroundColor: color + "15" },
            ]}
            onPress={() => !disabled && onChange(p.value)}
            disabled={disabled}
          >
            <MaterialIcons name={p.icon as any} size={14} color={selected ? "#fff" : color} />
            <Text style={[styles.label, { color: selected ? "#fff" : color }]}>{p.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: theme.spacing.sm, flexWrap: "wrap" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: theme.borderRadius.full, borderWidth: 1.5 },
  label: { fontSize: 12, fontWeight: "600" },
});
