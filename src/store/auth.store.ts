import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { AuthUser, UserRole } from "../types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setSession: (
    user: AuthUser,
    accessToken: string,
    refreshToken: string
  ) => Promise<void>;
  setAccessToken: (token: string) => void;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;

  // Helpers
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isFM: () => boolean;
  isResident: () => boolean;
  isGuard: () => boolean;
  isTechnician: () => boolean;
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync("accessToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);
    await SecureStore.setItemAsync("authUser", JSON.stringify(user));
    set({ user, accessToken, isAuthenticated: true });
  },

  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("accessToken").catch(() => {});
    await SecureStore.deleteItemAsync("refreshToken").catch(() => {});
    await SecureStore.deleteItemAsync("authUser").catch(() => {});
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  loadSession: async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync("accessToken"),
        SecureStore.getItemAsync("authUser"),
      ]);
      if (token && userJson) {
        const user: AuthUser = JSON.parse(userJson);
        set({ user, accessToken: token, isAuthenticated: true });
      }
    } catch {
      // Session corrupted — treat as logged out
    } finally {
      set({ isLoading: false });
    }
  },

  // Role helpers
  hasRole: (role) => get().user?.roles.includes(role) ?? false,
  hasAnyRole: (roles) =>
    get().user?.roles.some((r) => roles.includes(r)) ?? false,
  isAdmin: () =>
    get().hasAnyRole([
      "SUPER_ADMIN",
      "SUPERADMIN",
      "TENANT_ADMIN",
      "COMMUNITY_ADMIN",
    ]),
  // COMMUNITY_ADMIN goes to Admin panel — FM is strictly the operational field role
  isFM: () => get().hasRole("FM"),
  isResident: () => get().hasRole("RESIDENT"),
  isGuard: () => get().hasRole("GUARD"),
  isTechnician: () => get().hasRole("TECHNICIAN"),
  isSuperAdmin: () =>
    get().hasAnyRole(["SUPER_ADMIN", "SUPERADMIN", "TENANT_ADMIN"]),
}));
