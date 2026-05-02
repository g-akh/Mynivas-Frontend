import { apiClient } from "./client";
import type { LedgerEntry, LedgerStatus } from "../types";

export async function getBillingDashboard(params: {
  communityId: string;
  month?: string;
}): Promise<any> {
  const { data } = await apiClient.get("/v1/billing/dashboard", {
    params: { community_id: params.communityId, month: params.month },
  });
  return data;
}

export async function listDues(params?: {
  communityId?: string;
  status?: LedgerStatus;
  unitId?: string;
}): Promise<LedgerEntry[]> {
  const { data } = await apiClient.get("/v1/billing/dues", { params: {
    community_id: params?.communityId,
    status: params?.status,
  }});
  return data.dues ?? data.items ?? data ?? [];
}

export async function getUnitLedger(unitId: string): Promise<LedgerEntry[]> {
  const { data } = await apiClient.get(`/v1/billing/dues/${unitId}`);
  return data.dues ?? data ?? [];
}

export async function getBalance(unitId: string): Promise<{ outstanding: number }> {
  const { data } = await apiClient.get(`/v1/billing/balance/${unitId}`);
  return data;
}

export async function recordPayment(input: {
  unitLedgerId: string;
  amount: number;
  paymentMethod: string;
  referenceNo?: string;
}): Promise<any> {
  const { data } = await apiClient.post("/v1/billing/payments", {
    unit_ledger_id: input.unitLedgerId,
    amount: input.amount,
    payment_method: input.paymentMethod,
    reference_no: input.referenceNo,
  });
  return data;
}

export async function listPayments(): Promise<any[]> {
  const { data } = await apiClient.get("/v1/billing/payments");
  return data.payments ?? data ?? [];
}

export async function getReceipt(id: string): Promise<any> {
  const { data } = await apiClient.get(`/v1/billing/receipts/${id}`);
  return data;
}

export async function listReceipts(unitId?: string): Promise<any[]> {
  const { data } = await apiClient.get("/v1/billing/receipts", {
    params: unitId ? { unit_id: unitId } : undefined,
  });
  return data.receipts ?? data ?? [];
}

export async function getBillingSummary(communityId: string): Promise<any> {
  const { data } = await apiClient.get("/v1/billing/summary", {
    params: { community_id: communityId },
  });
  return data;
}
