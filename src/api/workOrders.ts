import { apiClient } from "./client";
import type { WorkOrder, WorkOrderStatus, WorkOrderType, WorkOrderPriority } from "../types";

export async function listWorkOrders(params?: {
  status?: WorkOrderStatus;
  type?: WorkOrderType;
  limit?: number;
  offset?: number;
}): Promise<WorkOrder[]> {
  const { data } = await apiClient.get("/v1/work-orders", { params });
  return data.workOrders ?? data.items ?? data ?? [];
}

export async function getWorkOrder(id: string): Promise<WorkOrder> {
  const { data } = await apiClient.get(`/v1/work-orders/${id}`);
  return data;
}

export async function createWorkOrder(input: {
  tenantId: string;
  communityId: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  description?: string;
}): Promise<WorkOrder> {
  const { data } = await apiClient.post("/v1/work-orders", {
    tenantId: input.tenantId,
    communityId: input.communityId,
    type: input.type,
    priority: input.priority,
  });
  return data;
}

export async function updateWorkOrder(
  id: string,
  patch: Partial<{ dueDate: string; notes: string }>
): Promise<WorkOrder> {
  const { data } = await apiClient.patch(`/v1/work-orders/${id}`, patch);
  return data;
}

export async function assignWorkOrder(
  id: string,
  assignedTo: string,
  dueDate?: string,
  note?: string
): Promise<WorkOrder> {
  const { data } = await apiClient.post(`/v1/work-orders/${id}/assign`, { assignedTo, dueDate, note });
  return data;
}

export async function startWorkOrder(id: string, note?: string): Promise<WorkOrder> {
  const { data } = await apiClient.post(`/v1/work-orders/${id}/start`, { note });
  return data;
}

export async function completeWorkOrder(
  id: string,
  notes?: string,
  proofPhotos?: string[]
): Promise<WorkOrder> {
  const { data } = await apiClient.post(`/v1/work-orders/${id}/complete`, { notes, proofPhotos });
  return data;
}

export async function blockWorkOrder(id: string, reason: string): Promise<WorkOrder> {
  const { data } = await apiClient.post(`/v1/work-orders/${id}/block`, { reason });
  return data;
}

export async function cancelWorkOrder(id: string, reason: string): Promise<WorkOrder> {
  const { data } = await apiClient.post(`/v1/work-orders/${id}/cancel`, { reason });
  return data;
}

export async function rateWorkOrder(
  id: string,
  input: { residentId: string; rating: number; feedback?: string }
): Promise<void> {
  await apiClient.post(`/v1/work-orders/${id}/ratings`, {
    workOrderId: id,
    residentId: input.residentId,
    rating: input.rating,
    feedback: input.feedback,
  });
}

// PPM
export async function listAssets(): Promise<any[]> {
  const { data } = await apiClient.get("/v1/ppm/assets");
  return data.assets ?? data.items ?? data ?? [];
}

export async function createAsset(input: {
  tenantId: string;
  communityId: string;
  name: string;
  category: string;
}): Promise<any> {
  const { data } = await apiClient.post("/v1/ppm/assets", {
    tenantId: input.tenantId,
    communityId: input.communityId,
    name: input.name,
    category: input.category,
    status: "ACTIVE",
  });
  return data;
}

export async function listSchedules(): Promise<any[]> {
  const { data } = await apiClient.get("/v1/ppm/ppm-schedules");
  return data.schedules ?? data.items ?? data ?? [];
}

export async function createSchedule(input: {
  tenantId: string;
  assetId: string;
  interval: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
  nextDueDate: string;
}): Promise<any> {
  const { data } = await apiClient.post("/v1/ppm/ppm-schedules", {
    tenantId: input.tenantId,
    assetId: input.assetId,
    interval: input.interval,
    nextDueDate: input.nextDueDate,
    isActive: true,
  });
  return data;
}
