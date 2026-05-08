import { apiClient } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Vendor {
  id: string;
  community_id: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  notes: string;
  rating: number;
  total_jobs: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  community_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  condition: string;
  created_at: string;
  updated_at: string;
}

export interface ParkingSlot {
  id: string;
  community_id: string;
  slot_number: string;
  slot_type: string;
  status: string;
  occupant: string;
  vehicle_num: string;
  notes: string;
  updated_at: string;
}

export interface PatrolLog {
  id: string;
  community_id: string;
  guard_id: string;
  guard_name: string;
  location: string;
  notes: string;
  status: string;
  created_at: string;
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export async function listVendors(communityId: string): Promise<Vendor[]> {
  const { data } = await apiClient.get(`/v1/communities/${communityId}/vendors`);
  return data.vendors ?? [];
}

export async function createVendor(communityId: string, input: {
  name: string; category: string; phone?: string; email?: string; notes?: string; status?: string;
}): Promise<{ id: string }> {
  const { data } = await apiClient.post(`/v1/communities/${communityId}/vendors`, input);
  return data;
}

export async function updateVendor(communityId: string, vendorId: string, patch: Partial<{
  name: string; category: string; phone: string; email: string; notes: string;
  rating: number; totalJobs: number; status: string;
}>): Promise<Vendor> {
  const { data } = await apiClient.patch(`/v1/communities/${communityId}/vendors/${vendorId}`, patch);
  return data.vendor;
}

export async function deleteVendor(communityId: string, vendorId: string): Promise<void> {
  await apiClient.delete(`/v1/communities/${communityId}/vendors/${vendorId}`);
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function listInventory(communityId: string): Promise<InventoryItem[]> {
  const { data } = await apiClient.get(`/v1/communities/${communityId}/inventory`);
  return data.items ?? [];
}

export async function createInventoryItem(communityId: string, input: {
  name: string; category: string; quantity: number; unit?: string; location?: string; condition?: string;
}): Promise<{ id: string }> {
  const { data } = await apiClient.post(`/v1/communities/${communityId}/inventory`, input);
  return data;
}

export async function updateInventoryItem(communityId: string, itemId: string, patch: Partial<{
  name: string; category: string; quantity: number; unit: string; location: string; condition: string;
}>): Promise<InventoryItem> {
  const { data } = await apiClient.patch(`/v1/communities/${communityId}/inventory/${itemId}`, patch);
  return data.item;
}

export async function deleteInventoryItem(communityId: string, itemId: string): Promise<void> {
  await apiClient.delete(`/v1/communities/${communityId}/inventory/${itemId}`);
}

// ─── Parking ──────────────────────────────────────────────────────────────────

export async function listParking(communityId: string): Promise<ParkingSlot[]> {
  const { data } = await apiClient.get(`/v1/communities/${communityId}/parking`);
  return data.slots ?? [];
}

export async function createParkingSlot(communityId: string, input: {
  slotNumber: string; slotType?: string; notes?: string;
}): Promise<{ id: string }> {
  const { data } = await apiClient.post(`/v1/communities/${communityId}/parking`, input);
  return data;
}

export async function updateParkingSlot(communityId: string, slotId: string, patch: {
  status?: string; occupant?: string; vehicleNum?: string; notes?: string;
}): Promise<ParkingSlot> {
  const { data } = await apiClient.patch(`/v1/communities/${communityId}/parking/${slotId}`, patch);
  return data.slot;
}

export async function deleteParkingSlot(communityId: string, slotId: string): Promise<void> {
  await apiClient.delete(`/v1/communities/${communityId}/parking/${slotId}`);
}

// ─── Patrol logs ──────────────────────────────────────────────────────────────

export async function listPatrolLogs(communityId: string): Promise<PatrolLog[]> {
  const { data } = await apiClient.get(`/v1/communities/${communityId}/patrol`);
  return data.logs ?? [];
}

export async function createPatrolLog(communityId: string, input: {
  guardName: string; location: string; notes?: string; status?: string;
}): Promise<{ id: string }> {
  const { data } = await apiClient.post(`/v1/communities/${communityId}/patrol`, input);
  return data;
}
