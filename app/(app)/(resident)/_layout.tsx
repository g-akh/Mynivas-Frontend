/**
 * Resident Tab Navigator
 * Tabs: Home | Visitors | Scan | Notices | Me
 */
import { Tabs } from "expo-router";
import { Platform, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../src/store/auth.store";
import { Redirect } from "expo-router";
import { theme } from "../../../src/theme";

function ScanTabIcon({ color }: { color: string }) {
  return (
    <View style={scanStyles.wrap}>
      <MaterialIcons name="qr-code-scanner" size={26} color="#FFFFFF" />
    </View>
  );
}

const scanStyles = StyleSheet.create({
  wrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: theme.colors.primary,
    justifyContent: "center", alignItems: "center",
    marginBottom: 14,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default function ResidentLayout() {
  const { isResident } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isResident()) return <Redirect href="/(auth)/login" />;

  const bottomPadding = Platform.OS === "android" ? Math.max(insets.bottom, 8) : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabActive,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 64 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          elevation: 12,
          shadowColor: "#1565C0",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <MaterialIcons name="home" size={26} color={color} />
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: theme.colors.primary,
                  alignSelf: "center", marginTop: 2,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: "Visitors",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="people" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "",
          tabBarIcon: ({ color }) => <ScanTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: "Notices",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="campaign" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Me",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="account-circle" size={26} color={color} />
          ),
        }}
      />

      {/* Sub-routes hidden from tab bar */}
      <Tabs.Screen name="complaints"      options={{ href: null }} />
      <Tabs.Screen name="bookings"        options={{ href: null }} />
      <Tabs.Screen name="amenities/index" options={{ href: null }} />
      <Tabs.Screen name="amenities/[id]"  options={{ href: null }} />
      <Tabs.Screen name="billing/index"   options={{ href: null }} />
      <Tabs.Screen name="documents/index" options={{ href: null }} />
      <Tabs.Screen name="settings"        options={{ href: null }} />
    </Tabs>
  );
}
