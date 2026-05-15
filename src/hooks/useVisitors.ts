import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listVisitors,
  approveVisitor,
  rejectVisitor,
  checkinVisitor,
  checkoutVisitor,
  listVisitorPasses,
  createVisitorPass,
  createVisitor,
} from "../api/visitors";
import type { VisitorStatus, VisitorType } from "../types";

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

export function useApproveVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      approveVisitor(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitors"] }),
  });
}

export function useRejectVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectVisitor(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitors"] }),
  });
}

export function useCheckinVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      checkinVisitor(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitors"] }),
  });
}

export function useCheckoutVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      checkoutVisitor(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitors"] }),
  });
}

export function useCreateVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      communityId: string;
      unitId: string;
      visitorName: string;
      visitorPhone: string;
      visitorType: VisitorType;
      unitNumber?: string;
    }) => createVisitor(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitors"] }),
  });
}

export function useCreateVisitorPass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVisitorPass,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitor-passes"] });
      qc.invalidateQueries({ queryKey: ["visitors"] });
    },
  });
}
