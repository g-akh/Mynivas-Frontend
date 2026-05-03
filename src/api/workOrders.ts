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
    tenant_id: input.tenantId,
    community_id: input.communityId,
    type: input.type,
    status: "OPEN",
    priority: input.priority,
  });
  return data;
}

export async function updateWorkOrder(
  id: string,
  patch: Partial<{ status: WorkOrderStatus; priority: WorkOrderPriority; assigned_to: string }>
): Promise<WorkOrder> {
  const { data } = await apiClient.patch(`/v1/work-orders/${id}`, patch);
  return data;
}

export async function rateWorkOrder(
  id: string,
  input: { residentId: string; rating: number; feedback?: string }
): Promise<void> {
  await apiClient.post(`/v1/work-orders/${id}/ratings`, {
    resident_id: input.residentId,
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
    tenant_id: input.tenantId,
    community_id: input.communityId,
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
    tenant_id: input.tenantId,
    asset_id: input.assetId,
    interval: input.interval,
    next_due_date: input.nextDueDate,
    is_active: true,
  });
  return data;
}
