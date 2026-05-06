import { apiClient } from "./client";
import type { Complaint, ComplaintStatus, ComplaintPriority } from "../types";

export interface CreateComplaintInput {
  communityId: string;
  unitId: string;
  tenantId: string;
  category: string;
  priority: ComplaintPriority;
  description: string;
}

export async function listComplaints(params?: {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  limit?: number;
  offset?: number;
}): Promise<Complaint[]> {
  const { data } = await apiClient.get("/v1/complaints", { params });
  return data.complaints ?? data.items ?? data ?? [];
}

export async function getComplaint(id: string): Promise<Complaint> {
  const { data } = await apiClient.get(`/v1/complaints/${id}`);
  return data;
}

export async function createComplaint(input: CreateComplaintInput): Promise<Complaint> {
  const { data } = await apiClient.post("/v1/complaints", {
    tenantId: input.tenantId,
    communityId: input.communityId,
    unitId: input.unitId,
    category: input.category,
    priority: input.priority,
    description: input.description,
  });
  return data;
}

export async function updateComplaint(
  id: string,
  patch: Partial<{ priority: ComplaintPriority; description: string }>
): Promise<Complaint> {
  const { data } = await apiClient.patch(`/v1/complaints/${id}`, patch);
  return data;
}

export async function assignComplaint(
  id: string,
  assignedTo: string,
  note?: string
): Promise<Complaint> {
  const { data } = await apiClient.post(`/v1/complaints/${id}/assign`, { assignedTo, note });
  return data;
}

export async function changeComplaintStatus(
  id: string,
  status: ComplaintStatus,
  resolutionSummary?: string,
  note?: string
): Promise<Complaint> {
  const { data } = await apiClient.post(`/v1/complaints/${id}/status`, { status, resolutionSummary, note });
  return data;
}

export const COMPLAINT_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Security",
  "Cleaning / Housekeeping",
  "Lift / Elevator",
  "Parking",
  "Water Supply",
  "Internet / Network",
  "Structural / Civil",
  "Pest Control",
  "Other",
];
