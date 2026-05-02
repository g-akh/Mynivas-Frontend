import { create } from "zustand";

export interface ToastConfig {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  read: boolean;
  receivedAt: string;
}

interface UIState {
  toasts: ToastConfig[];
  notifications: NotificationItem[];
  unreadCount: number;

  showToast: (config: Omit<ToastConfig, "id">) => void;
  dismissToast: (id: string) => void;
  addNotification: (n: Omit<NotificationItem, "id" | "read" | "receivedAt">) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
}

let toastCounter = 0;
let notifCounter = 0;

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  notifications: [],
  unreadCount: 0,

  showToast: (config) => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { ...config, id }] }));
    setTimeout(
      () => get().dismissToast(id),
      config.duration ?? 4000
    );
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  addNotification: (n) => {
    const item: NotificationItem = {
      ...n,
      id: `notif-${++notifCounter}`,
      read: false,
      receivedAt: new Date().toISOString(),
    };
    set((s) => ({
      notifications: [item, ...s.notifications].slice(0, 50), // keep last 50
      unreadCount: s.unreadCount + 1,
    }));
  },

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearNotifications: () =>
    set({ notifications: [], unreadCount: 0 }),
}));

// Convenience helper — usable outside React components
export function showToast(config: Omit<ToastConfig, "id">) {
  useUIStore.getState().showToast(config);
}
