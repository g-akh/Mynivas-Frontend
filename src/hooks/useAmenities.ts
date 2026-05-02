import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAmenities,
  listBookings,
  createBooking,
  cancelBooking,
  approveBooking,
  rejectBooking,
} from "../api/amenities";
import type { BookingStatus } from "../types";
import { useAuthStore } from "../store/auth.store";

export function useAmenityList(communityId?: string) {
  const storeCommunityId = useAuthStore((s) => s.user?.communityId ?? "");
  const cId = communityId ?? storeCommunityId;
  return useQuery({
    queryKey: ["amenities", cId],
    queryFn: () => listAmenities(cId),
    enabled: !!cId,
    staleTime: 60_000,
  });
}

export function useBookingList(params?: { status?: BookingStatus; amenity_id?: string }) {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: () => listBookings(params),
    staleTime: 30_000,
  });
}

export function useApproveBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => approveBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useRejectBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectBooking(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
