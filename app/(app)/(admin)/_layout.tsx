/**
 * Admin / Super Admin Tab Navigator
 * Tabs: Overview | Tenants | Communities | Users | Settings
 */
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../src/store/auth.store";
import { Redirect } from "expo-router";
import { theme } from "../../../src/theme";

export default function AdminLayout() {
  const { isAdmin, isSuperAdmin } = useAuthStore();
  const insets = useSafeAreaInsets();

  // COMMUNITY_ADMIN sees community-scoped admin panel; SUPERADMIN/TENANT_ADMIN see full panel
  if (!isAdmin()) return <Redirect href="/(auth)/login" />;
  const superAdminOnly = isSuperAdmin();

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
        name="overview"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      {/* Tenants + Communities — SUPERADMIN only; hidden for COMMUNITY_ADMIN */}
      <Tabs.Screen
        name="tenants"
        options={{
          title: "Tenants",
          href: superAdminOnly ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: "Communities",
          href: superAdminOnly ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="location-city" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: "Vendors",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="handyman" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          title: "Import",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="upload-file" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
