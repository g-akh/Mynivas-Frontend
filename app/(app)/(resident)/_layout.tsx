/**
 * Resident Tab Navigator
 * Tabs: Home | Complaints | Visitors | Bookings | More
 */
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../src/store/auth.store";
import { Redirect } from "expo-router";
import { theme } from "../../../src/theme";

export default function ResidentLayout() {
  const { isResident } = useAuthStore();

  // AppLayout above us already guards isAuthenticated.
  // If user is not a resident (wrong role), send them back to login
  // so the root index can re-route them to their correct home.
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
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
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
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event-available" size={size} color={color} />
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

      {/* Hide sub-routes from tab bar — expo-router v6 uses "folder/index" not "folder" */}
      <Tabs.Screen name="amenities/index" options={{ href: null }} />
      <Tabs.Screen name="amenities/[id]" options={{ href: null }} />
      <Tabs.Screen name="billing/index" options={{ href: null }} />
      <Tabs.Screen name="documents/index" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
