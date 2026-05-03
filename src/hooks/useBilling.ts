import { useQuery } from "@tanstack/react-query";
import { listDues, getBillingDashboard } from "../api/billing";
import { useAuthStore } from "../store/auth.store";
import type { LedgerStatus } from "../types";

export function useDuesList(status?: LedgerStatus) {
  const communityId = useAuthStore((s) => s.user?.communityId ?? "");
  return useQuery({
    queryKey: ["dues", communityId, status],
    queryFn: () => listDues({ communityId, status }),
    enabled: !!communityId,
    staleTime: 30_000,
  });
}

export function useBillingDashboard(month?: string) {
  const communityId = useAuthStore((s) => s.user?.communityId ?? "");
  return useQuery({
    queryKey: ["billing-dashboard", communityId, month],
    queryFn: () => getBillingDashboard({ communityId, month }),
    enabled: !!communityId,
    staleTime: 60_000,
  });
}
