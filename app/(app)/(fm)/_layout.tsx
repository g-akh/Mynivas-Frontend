/**
 * FM / Community Admin Tab Navigator
 * Tabs: Dashboard | Complaints | Visitors | Work Orders | More
 */
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../src/store/auth.store";
import { Redirect } from "expo-router";
import { theme } from "../../../src/theme";

export default function FMLayout() {
  const { isFM } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isFM()) return <Redirect href="/(auth)/login" />;

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
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: "Complaints",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="report-problem" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: "Visitors",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="how-to-reg" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="work-orders"
        options={{
          title: "Work Orders",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="build" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="more-horiz" size={size} color={color} />
          ),
        }}
      />
      {/* Hide sub-route screens from the tab bar — expo-router v6 uses "folder/index" not "folder" */}
      <Tabs.Screen name="amenities/index" options={{ href: null }} />
      <Tabs.Screen name="reports/index" options={{ href: null }} />
      <Tabs.Screen name="vendors/index" options={{ href: null }} />
      <Tabs.Screen name="schedule/index" options={{ href: null }} />
    </Tabs>
  );
}
