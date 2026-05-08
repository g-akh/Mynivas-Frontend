import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listComplaints, getComplaint, createComplaint, updateComplaint, assignComplaint, changeComplaintStatus } from "../api/complaints";
import type { ComplaintStatus } from "../types";

export function useComplaintList(status?: ComplaintStatus, assignedTo?: string) {
  return useQuery({
    queryKey: ["complaints", status, assignedTo],
    queryFn: () => listComplaints({ status, assignedTo }),
    staleTime: 30_000,
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: ["complaint", id],
    queryFn: () => getComplaint(id),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createComplaint,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["complaints"] }),
  });
}

export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateComplaint>[1] }) =>
      updateComplaint(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["complaints"] });
      qc.invalidateQueries({ queryKey: ["complaint", id] });
    },
  });
}

export function useAssignComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedTo, note }: { id: string; assignedTo: string; note?: string }) =>
      assignComplaint(id, assignedTo, note),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["complaints"] });
      qc.invalidateQueries({ queryKey: ["complaint", id] });
    },
  });
}

export function useChangeComplaintStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, resolutionSummary, note }: { id: string; status: ComplaintStatus; resolutionSummary?: string; note?: string }) =>
      changeComplaintStatus(id, status, resolutionSummary, note),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["complaints"] });
      qc.invalidateQueries({ queryKey: ["complaint", id] });
    },
  });
}
