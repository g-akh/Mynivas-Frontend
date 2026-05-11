/**
 * Guard Tab Navigator — Purple palette
 * Tabs: Gate | Pre-Approved | Parcels | Alerts | More (Parking · Patrol · History · Profile)
 */
import { Tabs } from "expo-router";
import { Platform, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../src/store/auth.store";
import { Redirect } from "expo-router";
import { guardTheme as g } from "../../../src/theme/guardTheme";

function ScanTabIcon({ color }: { color: string }) {
  return (
    <View style={fab.wrap}>
      <MaterialIcons name="sensor-door" size={26} color="#FFFFFF" />
    </View>
  );
}

const fab = StyleSheet.create({
  wrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: g.colors.primary,
    justifyContent: "center", alignItems: "center",
    marginBottom: 14,
    shadowColor: g.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default function GuardLayout() {
  const { isGuard } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isGuard()) return <Redirect href="/(auth)/login" />;

  const bottomPadding = Platform.OS === "android" ? Math.max(insets.bottom, 8) : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   g.colors.tabActive,
        tabBarInactiveTintColor: g.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: g.colors.surface,
          borderTopColor:  g.colors.border,
          height: 64 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          elevation: 12,
          shadowColor:  g.colors.primaryDark,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="gate"
        options={{
          title: "Gate",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <MaterialIcons name="sensor-door" size={24} color={color} />
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: g.colors.primary, alignSelf: "center", marginTop: 2 }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="preapproved"
        options={{
          title: "Approved",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="verified-user" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parcels"
        options={{
          title: "Parcels",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="inventory" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="add-alert" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patrol"
        options={{
          title: "Patrol",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="directions-walk" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parking"
        options={{
          title: "Parking",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="local-parking" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="history" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="account-circle" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
