/**
 * Phase 17 — Store unit tests
 */
import { act } from "@testing-library/react-native";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { useAuthStore } from "../src/store/auth.store";
import { useUIStore, showToast } from "../src/store/ui.store";
import type { AuthUser } from "../src/types";

const mockUser: AuthUser = {
  id: "u1",
  tenantId: "t1",
  communityId: "c1",
  roles: ["FM"],
  phone: "+919876543210",
  name: "Test FM",
};

describe("AuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  });

  it("initial state is not authenticated", () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("setSession stores user and marks authenticated", async () => {
    await act(async () => {
      await useAuthStore.getState().setSession(mockUser, "tok-abc", "ref-xyz");
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().accessToken).toBe("tok-abc");
  });

  it("logout clears state", async () => {
    await act(async () => {
      await useAuthStore.getState().setSession(mockUser, "tok-abc", "ref-xyz");
      await useAuthStore.getState().logout();
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("hasRole returns true for matching role", async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });
    expect(useAuthStore.getState().hasRole("FM")).toBe(true);
    expect(useAuthStore.getState().hasRole("RESIDENT")).toBe(false);
  });

  it("isFM returns true for FM and COMMUNITY_ADMIN", () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });
    expect(useAuthStore.getState().isFM()).toBe(true);
  });
});

describe("UIStore — showToast", () => {
  beforeEach(() => {
    useUIStore.setState({ toasts: [], notifications: [], unreadCount: 0 });
  });

  it("showToast adds toast to store", () => {
    act(() => showToast({ type: "success", message: "Test message" }));
    expect(useUIStore.getState().toasts).toHaveLength(1);
    expect(useUIStore.getState().toasts[0].message).toBe("Test message");
  });

  it("dismissToast removes toast by id", () => {
    act(() => showToast({ type: "info", message: "Dismiss me" }));
    const id = useUIStore.getState().toasts[0].id;
    act(() => useUIStore.getState().dismissToast(id));
    expect(useUIStore.getState().toasts).toHaveLength(0);
  });

  it("addNotification increments unreadCount", () => {
    act(() => useUIStore.getState().addNotification({ title: "Test", body: "Body", type: "BOOKING" }));
    expect(useUIStore.getState().unreadCount).toBe(1);
    expect(useUIStore.getState().notifications).toHaveLength(1);
  });

  it("markAllRead zeroes unreadCount", () => {
    act(() => {
      useUIStore.getState().addNotification({ title: "N1", body: "B1", type: "BOOKING" });
      useUIStore.getState().addNotification({ title: "N2", body: "B2", type: "VISITOR" });
      useUIStore.getState().markAllRead();
    });
    expect(useUIStore.getState().unreadCount).toBe(0);
    expect(useUIStore.getState().notifications.every(n => n.read)).toBe(true);
  });
});
