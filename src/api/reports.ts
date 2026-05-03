import { apiClient } from "./client";
import type { DashboardData } from "../types";

export async function getDashboard(communityId: string): Promise<DashboardData> {
  const { data } = await apiClient.get("/v1/reports/dashboard", {
    params: { community_id: communityId },
  });
  return data;
}
