import { apiClient } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HouseholdMember {
  id: string;
  user_id: string;
  name: string;
  relation: string;
  phone: string;
  created_at: string;
}

export interface UserVehicle {
  id: string;
  user_id: string;
  number: string;
  type: string;
  color: string;
  created_at: string;
}

export interface NotificationPrefs {
  visitor_alerts: boolean;
  delivery_alerts: boolean;
  payment_reminders: boolean;
  announcements: boolean;
  complaints: boolean;
  amenity_bookings: boolean;
}

// ─── Household ────────────────────────────────────────────────────────────────

export async function listHousehold(userId: string): Promise<HouseholdMember[]> {
  const { data } = await apiClient.get(`/v1/users/${userId}/household`);
  return data.members ?? [];
}

export async function addHouseholdMember(userId: string, input: {
  name: string; relation: string; phone?: string;
}): Promise<{ id: string }> {
  const { data } = await apiClient.post(`/v1/users/${userId}/household`, input);
  return data;
}

export async function deleteHouseholdMember(userId: string, memberId: string): Promise<void> {
  await apiClient.delete(`/v1/users/${userId}/household/${memberId}`);
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export async function listVehicles(userId: string): Promise<UserVehicle[]> {
  const { data } = await apiClient.get(`/v1/users/${userId}/vehicles`);
  return data.vehicles ?? [];
}

export async function addVehicle(userId: string, input: {
  number: string; type?: string; color?: string;
}): Promise<{ id: string }> {
  const { data } = await apiClient.post(`/v1/users/${userId}/vehicles`, input);
  return data;
}

export async function deleteVehicle(userId: string, vehicleId: string): Promise<void> {
  await apiClient.delete(`/v1/users/${userId}/vehicles/${vehicleId}`);
}

// ─── Notification prefs ───────────────────────────────────────────────────────

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs | null> {
  const { data } = await apiClient.get(`/v1/users/${userId}/notification-prefs`);
  return data.prefs ?? null;
}

export async function updateNotificationPrefs(userId: string, prefs: Partial<NotificationPrefs>): Promise<void> {
  await apiClient.put(`/v1/users/${userId}/notification-prefs`, prefs);
}
