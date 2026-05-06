import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listWorkOrders,
  updateWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  blockWorkOrder,
} from "../api/workOrders";
import type { WorkOrderStatus } from "../types";

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
    mutationFn: ({ id, patch }: { id: string; patch: Partial<{ dueDate: string; notes: string }> }) =>
      updateWorkOrder(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-orders"] }),
  });
}

export function useStartWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => startWorkOrder(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-orders"] }),
  });
}

export function useCompleteWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes, proofPhotos }: { id: string; notes?: string; proofPhotos?: string[] }) =>
      completeWorkOrder(id, notes, proofPhotos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-orders"] }),
  });
}

export function useBlockWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => blockWorkOrder(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-orders"] }),
  });
}
