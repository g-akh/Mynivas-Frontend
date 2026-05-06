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
    tenantId: input.tenantId,
    communityId: input.communityId,
    unitId: input.unitId,
    visitorName: input.visitorName,
    visitorPhone: input.visitorPhone,
    visitorType: input.visitorType,
  });
  return data;
}

export async function approveVisitor(id: string, note?: string): Promise<Visitor> {
  const { data } = await apiClient.post(`/v1/visitors/${id}/approve`, { note });
  return data;
}

export async function rejectVisitor(id: string, reason: string): Promise<Visitor> {
  const { data } = await apiClient.post(`/v1/visitors/${id}/reject`, { reason });
  return data;
}

export async function checkinVisitor(id: string, note?: string): Promise<Visitor> {
  const { data } = await apiClient.post(`/v1/visitors/${id}/checkin`, { note });
  return data;
}

export async function checkoutVisitor(id: string, note?: string): Promise<Visitor> {
  const { data } = await apiClient.post(`/v1/visitors/${id}/checkout`, { note });
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
    tenantId: input.tenantId,
    unitId: input.unitId,
    residentId: input.residentId,
    visitorName: input.visitorName,
    expectedAt: input.expectedAt,
    expiresAt: input.expiresAt,
    status: "ACTIVE",
    createdVia: "MOBILE",
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
    tenantId: input.tenantId,
    communityId: input.communityId,
    visitorName: input.visitorName,
    visitorPhone: input.visitorPhone,
    reason: input.reason,
  });
}
