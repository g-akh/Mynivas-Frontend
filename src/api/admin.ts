import { apiClient } from "./client";

// ── Tenants ────────────────────────────────────────────────────────────────

export async function listTenants(): Promise<any[]> {
  const { data } = await apiClient.get("/v1/tenants");
  return data.tenants ?? data ?? [];
}

export async function createTenant(input: { name: string; status?: string }): Promise<any> {
  const { data } = await apiClient.post("/v1/tenants", input);
  return data;
}

export async function updateTenant(id: string, patch: { name?: string; status?: string }): Promise<any> {
  const { data } = await apiClient.patch(`/v1/tenants/${id}`, patch);
  return data;
}

// ── Onboarding ─────────────────────────────────────────────────────────────

export async function createOnboarding(
  payload: {
    tenant: { name: string };
    community: { name: string; timezone: string; address: string };
    adminUser: { name: string; phone: string; email?: string };
  },
  idempotencyKey: string
): Promise<any> {
  const { data } = await apiClient.post("/v1/onboarding/communities", payload, {
    headers: { "X-Idempotency-Key": idempotencyKey },
  });
  return data;
}

export async function getOnboarding(id: string): Promise<any> {
  const { data } = await apiClient.get(`/v1/onboarding/${id}`);
  return data;
}

// ── Communities ────────────────────────────────────────────────────────────

export async function listCommunities(): Promise<any[]> {
  const { data } = await apiClient.get("/v1/communities");
  return data.communities ?? data ?? [];
}

export async function getCommunity(id: string): Promise<any> {
  const { data } = await apiClient.get(`/v1/communities/${id}`);
  return data;
}

export async function updateCommunity(id: string, patch: { name?: string; city?: string }): Promise<any> {
  const { data } = await apiClient.patch(`/v1/communities/${id}`, patch);
  return data;
}

export async function createBuilding(communityId: string, input: { name: string; floors?: number }): Promise<any> {
  const { data } = await apiClient.post(`/v1/communities/${communityId}/buildings`, input);
  return data;
}

export async function createUnit(
  communityId: string,
  input: { buildingId: string; unitNumber: string; floor?: number }
): Promise<any> {
  const { data } = await apiClient.post(`/v1/communities/${communityId}/units`, {
    buildingId: input.buildingId,
    unitNumber: input.unitNumber,
    floor: input.floor,
  });
  return data;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<any[]> {
  const { data } = await apiClient.get("/v1/users");
  return data.users ?? data ?? [];
}

export async function getUser(userId: string): Promise<any> {
  const { data } = await apiClient.get(`/v1/users/${userId}`);
  return data;
}

export async function createUser(input: {
  tenantId: string;
  communityId: string;
  phone: string;
  name?: string;
  roles?: string[];
}): Promise<any> {
  const { data } = await apiClient.post("/v1/users", {
    tenantId: input.tenantId,
    communityId: input.communityId,
    phone: input.phone,
    name: input.name,
    roles: input.roles,
  });
  return data;
}

export async function updateUser(userId: string, patch: { name?: string; status?: string }): Promise<any> {
  const { data } = await apiClient.patch(`/v1/users/${userId}`, patch);
  return data;
}

export async function deleteUser(userId: string): Promise<any> {
  const { data } = await apiClient.delete(`/v1/users/${userId}`);
  return data;
}

export async function assignRole(userId: string, role: string): Promise<any> {
  const { data } = await apiClient.post(`/v1/users/${userId}/roles`, { role });
  return data;
}

export async function assignUnit(userId: string, unitId: string): Promise<any> {
  const { data } = await apiClient.post(`/v1/users/${userId}/units`, { unitId });
  return data;
}

// ── Audit Logs ─────────────────────────────────────────────────────────────

export async function getAuditLog(params?: {
  entityType?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: any[]; total?: number }> {
  const { data } = await apiClient.get("/v1/auth/audit", { params });
  return data;
}

// ── Plans ──────────────────────────────────────────────────────────────────

export async function listPlans(): Promise<any[]> {
  const { data } = await apiClient.get("/v1/plans");
  return data.plans ?? data ?? [];
}

export async function getPlanFeatures(planId: string): Promise<any[]> {
  const { data } = await apiClient.get(`/v1/plans/${planId}/features`);
  return data.features ?? data ?? [];
}

export async function getEffectiveFeatures(tenantId: string): Promise<Record<string, string>> {
  const { data } = await apiClient.get(`/v1/plans/features/effective/${tenantId}`);
  return data;
}

export async function getTenantSubscription(tenantId: string): Promise<any> {
  const { data } = await apiClient.get(`/v1/plans/subscriptions/${tenantId}`);
  return data;
}

export async function assignPlan(input: { tenantId: string; planId: string }): Promise<any> {
  const { data } = await apiClient.post("/v1/plans/subscriptions", input);
  return data;
}
