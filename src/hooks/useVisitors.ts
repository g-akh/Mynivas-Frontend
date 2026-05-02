import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listVisitors,
  updateVisitorStatus,
  listVisitorPasses,
  createVisitorPass,
} from "../api/visitors";
import type { VisitorStatus } from "../types";

export function useVisitorList(status?: VisitorStatus) {
  return useQuery({
    queryKey: ["visitors", status],
    queryFn: () => listVisitors({ status }),
    staleTime: 30_000,
  });
}

export function useVisitorPassList() {
  return useQuery({
    queryKey: ["visitor-passes"],
    queryFn: listVisitorPasses,
    staleTime: 30_000,
  });
}

export function useUpdateVisitorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VisitorStatus }) =>
      updateVisitorStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitors"] });
    },
  });
}

export function useCreateVisitorPass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVisitorPass,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitor-passes"] });
    },
  });
}
