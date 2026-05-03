import { apiClient } from "./client";
import type { AuthUser } from "../types";

export interface RequestOtpResponse {
  sessionId: string;
  expiresAt: string;
  otp?: string; // dev only when DEV_OTP_ECHO=1
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export async function requestOtp(phone: string): Promise<RequestOtpResponse> {
  const { data } = await apiClient.post("/v1/auth/request-otp", { phone });
  return data;
}

export async function verifyOtp(
  sessionId: string,
  otp: string
): Promise<AuthResponse> {
  const { data } = await apiClient.post("/v1/auth/verify-otp", {
    sessionId,
    otp,
  });
  return data;
}

export async function refreshTokens(
  refreshToken: string
): Promise<AuthResponse> {
  const { data } = await apiClient.post("/v1/auth/refresh", { refreshToken });
  return data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/v1/auth/logout").catch(() => {}); // best-effort
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get("/v1/auth/me");
  return data;
}

export async function registerDevice(
  userId: string,
  params: {
    deviceId: string;
    platform: "ANDROID" | "IOS";
    pushToken: string;
  }
): Promise<void> {
  await apiClient
    .post(`/v1/users/${userId}/devices`, params)
    .catch(() => {}); // best-effort
}
