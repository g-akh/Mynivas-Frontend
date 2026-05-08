/**
 * Guard Tab Navigator
 * Tabs: Gate | History | Profile
 */
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../src/store/auth.store";
import { Redirect } from "expo-router";
import { theme } from "../../../src/theme";

export default function GuardLayout() {
  const { isGuard } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isGuard()) return <Redirect href="/(auth)/login" />;

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
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="gate"
        options={{
          title: "Gate",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="sensor-door" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="preapproved"
        options={{
          title: "Pre-Approved",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="verified-user" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parcels"
        options={{
          title: "Parcels",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-alert" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parking"
        options={{
          title: "Parking",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="local-parking" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patrol"
        options={{
          title: "Patrol",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="directions-walk" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
