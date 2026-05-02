import { apiClient } from "./client";
import type { Visitor, VisitorPass, VisitorType, VisitorStatus } from "../types";

export async function listVisitors(params?: {
  status?: VisitorStatus;
  limit?: number;
  offset?: number;
}): Promise<Visitor[]> {
  const { data } = await apiClient.get("/v1/visitors", { params });
  return data.visitors ?? data.items ?? data ?? [];
}

export async function getVisitor(id: string): Promise<Visitor> {
  const { data } = await apiClient.get(`/v1/visitors/${id}`);
  return data;
}

export async function createVisitor(input: {
  tenantId: string;
  communityId: string;
  unitId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorType: VisitorType;
}): Promise<Visitor> {
  const { data } = await apiClient.post("/v1/visitors", {
    tenant_id: input.tenantId,
    community_id: input.communityId,
    unit_id: input.unitId,
    visitor_name: input.visitorName,
    visitor_phone: input.visitorPhone,
    visitor_type: input.visitorType,
  });
  return data;
}

export async function updateVisitorStatus(
  id: string,
  status: VisitorStatus
): Promise<Visitor> {
  const { data } = await apiClient.patch(`/v1/visitors/${id}`, { status });
  return data;
}

// Visitor Passes (pre-registration)
export async function listVisitorPasses(): Promise<VisitorPass[]> {
  const { data } = await apiClient.get("/v1/visitor-passes");
  return data.passes ?? data.items ?? data ?? [];
}

export async function createVisitorPass(input: {
  tenantId: string;
  unitId: string;
  residentId: string;
  visitorName: string;
  expectedAt: string;
  expiresAt: string;
}): Promise<VisitorPass> {
  const { data } = await apiClient.post("/v1/visitor-passes", {
    tenant_id: input.tenantId,
    unit_id: input.unitId,
    resident_id: input.residentId,
    visitor_name: input.visitorName,
    expected_at: input.expectedAt,
    expires_at: input.expiresAt,
    created_via: "ADMIN",
  });
  return data;
}

// Blocked visitors
export async function listBlockedVisitors(): Promise<
  { id: string; visitor_name: string; visitor_phone: string | null; reason: string | null }[]
> {
  const { data } = await apiClient.get("/v1/blocked-visitors");
  return data.blocked ?? data.items ?? data ?? [];
}

export async function blockVisitor(input: {
  tenantId: string;
  communityId: string;
  visitorName: string;
  visitorPhone?: string;
  reason?: string;
}): Promise<void> {
  await apiClient.post("/v1/blocked-visitors", {
    tenant_id: input.tenantId,
    community_id: input.communityId,
    visitor_name: input.visitorName,
    visitor_phone: input.visitorPhone,
    reason: input.reason,
  });
}
