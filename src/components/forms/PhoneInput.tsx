import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";

interface Country {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

const POPULAR_COUNTRIES: Country[] = [
  { code: "IN", dialCode: "+91", flag: "🇮🇳", name: "India" },
  { code: "US", dialCode: "+1",  flag: "🇺🇸", name: "United States" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "AE", dialCode: "+971",flag: "🇦🇪", name: "UAE" },
  { code: "SG", dialCode: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "AU", dialCode: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "CA", dialCode: "+1",  flag: "🇨🇦", name: "Canada" },
];

interface PhoneInputProps {
  value: string;
  onChangeText: (phone: string) => void; // returns full E.164 e.g. "+919876543210"
  error?: string;
  disabled?: boolean;
  testID?: string;
}

export default function PhoneInput({
  value,
  onChangeText,
  error,
  disabled = false,
  testID,
}: PhoneInputProps) {
  const [selected, setSelected] = useState<Country>(POPULAR_COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState(
    value.startsWith(selected.dialCode)
      ? value.slice(selected.dialCode.length)
      : value
  );
  const [showPicker, setShowPicker] = useState(false);

  const handleNumberChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    setLocalNumber(digits);
    onChangeText(`${selected.dialCode}${digits}`);
  };

  const handleCountrySelect = (country: Country) => {
    setSelected(country);
    setShowPicker(false);
    onChangeText(`${country.dialCode}${localNumber}`);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          error ? styles.containerError : null,
          disabled ? styles.containerDisabled : null,
        ]}
        testID={testID}
      >
        {/* Country picker trigger */}
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => !disabled && setShowPicker(true)}
          testID="phone-country-picker"
        >
          <Text style={styles.flag}>{selected.flag}</Text>
          <Text style={styles.dialCode}>{selected.dialCode}</Text>
          <MaterialIcons
            name="arrow-drop-down"
            size={18}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Number input */}
        <TextInput
          style={styles.input}
          value={localNumber}
          onChangeText={handleNumberChange}
          placeholder="Mobile number"
          placeholderTextColor={theme.colors.textDisabled}
          keyboardType="phone-pad"
          maxLength={15}
          editable={!disabled}
          testID="phone-number-input"
          autoComplete="tel"
          textContentType="telephoneNumber"
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Country Picker Modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={POPULAR_COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryRow,
                  item.code === selected.code ? styles.selectedRow : null,
                ]}
                onPress={() => handleCountrySelect(item)}
              >
                <Text style={styles.rowFlag}>{item.flag}</Text>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowDial}>{item.dialCode}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  containerError: { borderColor: theme.colors.danger },
  containerDisabled: { opacity: 0.55, backgroundColor: "#F8F9FA" },
  countryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  flag: { fontSize: 20 },
  dialCode: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
  },
  divider: {
    width: 1,
    height: "60%",
    backgroundColor: theme.colors.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  // Modal
  modal: { flex: 1, backgroundColor: theme.colors.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  selectedRow: { backgroundColor: "#EBF5FB" },
  rowFlag: { fontSize: 24, width: 32 },
  rowName: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  rowDial: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
});
