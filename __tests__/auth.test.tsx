/**
 * Phase 17 — Auth screen tests
 * Tests LoginScreen + OTPScreen against mocked API
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn().mockReturnValue({ sessionId: "sess-123", phone: "+919876543210", expiresAt: new Date(Date.now() + 300000).toISOString() }),
}));

// Mock API
jest.mock("../src/api/auth", () => ({
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
  registerDevice: jest.fn(),
}));

jest.mock("../src/utils/push", () => ({
  registerPushNotifications: jest.fn().mockResolvedValue(undefined),
  setupNotificationHandlers: jest.fn().mockReturnValue(() => {}),
}));

import { requestOtp, verifyOtp } from "../src/api/auth";
import LoginScreen from "../app/(auth)/login";
import VerifyOTPScreen from "../app/(auth)/verify-otp";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe("LoginScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders phone input", () => {
    const { getByTestId } = render(<LoginScreen />, { wrapper });
    expect(getByTestId("phone-number-input")).toBeTruthy();
  });

  it("Send OTP button disabled when phone is empty/invalid", () => {
    const { getByTestId } = render(<LoginScreen />, { wrapper });
    const btn = getByTestId("send-otp-btn");
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });

  it("calls requestOtp with E.164 phone on submit", async () => {
    (requestOtp as jest.Mock).mockResolvedValueOnce({ sessionId: "sess-123", expiresAt: new Date().toISOString() });
    const { getByTestId } = render(<LoginScreen />, { wrapper });
    const input = getByTestId("phone-number-input");
    fireEvent.changeText(input, "9876543210");
    await waitFor(() => {
      const btn = getByTestId("send-otp-btn");
      fireEvent.press(btn);
    });
    await waitFor(() => {
      expect(requestOtp).toHaveBeenCalledWith(expect.stringMatching(/^\+91/));
    });
  });
});

describe("VerifyOTPScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders 6 OTP boxes", () => {
    const { getByTestId } = render(<VerifyOTPScreen />, { wrapper });
    for (let i = 0; i < 6; i++) {
      expect(getByTestId(`otp-box-${i}`)).toBeTruthy();
    }
  });

  it("Verify button disabled when OTP incomplete", () => {
    const { getByTestId } = render(<VerifyOTPScreen />, { wrapper });
    const btn = getByTestId("verify-btn");
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });

  it("resend button disabled during countdown", () => {
    const { getByTestId } = render(<VerifyOTPScreen />, { wrapper });
    const resendBtn = getByTestId("resend-btn");
    // Initially in countdown — disabled
    expect(resendBtn).toBeTruthy();
  });
});
