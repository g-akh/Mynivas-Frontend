import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listWorkOrders, updateWorkOrder } from "../api/workOrders";
import type { WorkOrderStatus, WorkOrderPriority } from "../types";

export function useWorkOrderList(status?: WorkOrderStatus) {
  return useQuery({
    queryKey: ["work-orders", status],
    queryFn: () => listWorkOrders({ status }),
    staleTime: 30_000,
  });
}

export function useUpdateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<{ status: WorkOrderStatus; priority: WorkOrderPriority; assigned_to: string }>;
    }) => updateWorkOrder(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}
