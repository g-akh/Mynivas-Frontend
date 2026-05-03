import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ??
  "http://localhost:3001";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor — attach bearer token ─────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — token refresh on 401 ──────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) =>
    error ? p.reject(error) : p.resolve(token as string)
  );
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) throw new Error("No refresh token stored");

      const { data } = await axios.post(`${BASE_URL}/v1/auth/refresh`, {
        refreshToken,
      });

      await SecureStore.setItemAsync("accessToken", data.accessToken);
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);

      // Lazily import to avoid circular dependency
      const { useAuthStore } = await import("../store/auth.store");
      useAuthStore.getState().setAccessToken(data.accessToken);

      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      const { useAuthStore } = await import("../store/auth.store");
      await useAuthStore.getState().logout();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Error helpers ─────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as any)?.error?.message ??
      error.message ??
      "An unexpected error occurred"
    );
  }
  return "Network error. Check your connection.";
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError(error)) {
    const details: Array<{ field?: string; issue: string }> =
      (error.response?.data as any)?.error?.details ?? [];
    return Object.fromEntries(
      details.filter((d) => d.field).map((d) => [d.field!, d.issue])
    );
  }
  return {};
}
