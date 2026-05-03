import { apiClient } from "./client";
import type { Amenity, Booking, BookingStatus, SlotAvailability } from "../types";

export async function listAmenities(communityId: string): Promise<Amenity[]> {
  const { data } = await apiClient.get("/v1/amenities", {
    params: { community_id: communityId },
  });
  return data.amenities ?? data ?? [];
}

export async function getAmenity(id: string): Promise<Amenity> {
  const { data } = await apiClient.get(`/v1/amenities/${id}`);
  return data;
}

export async function getAvailability(
  amenityId: string,
  from: string,
  to: string
): Promise<SlotAvailability[]> {
  const { data } = await apiClient.get(`/v1/amenities/${amenityId}/availability`, {
    params: { from, to },
  });
  return data.availability ?? data ?? [];
}

export async function listBookings(params?: {
  status?: BookingStatus;
  amenity_id?: string;
  date?: string;
}): Promise<Booking[]> {
  const { data } = await apiClient.get("/v1/amenities/bookings", { params });
  return data.bookings ?? data ?? [];
}

export async function createBooking(input: {
  amenityId: string;
  slotId: string;
  unitId: string;
  date: string;
  notes?: string;
}): Promise<Booking> {
  const { data } = await apiClient.post("/v1/amenities/bookings", {
    amenity_id: input.amenityId,
    slot_id: input.slotId,
    unit_id: input.unitId,
    date: input.date,
    notes: input.notes,
  });
  return data;
}

export async function approveBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.post(`/v1/amenities/bookings/${id}/approve`);
  return data;
}

export async function rejectBooking(id: string, reason: string): Promise<Booking> {
  const { data } = await apiClient.post(`/v1/amenities/bookings/${id}/reject`, { reason });
  return data;
}

export async function cancelBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.post(`/v1/amenities/bookings/${id}/cancel`);
  return data;
}

export async function getCalendar(
  from: string,
  to: string,
  communityId: string
): Promise<any> {
  const { data } = await apiClient.get("/v1/amenities/calendar", {
    params: { from, to, community_id: communityId },
  });
  return data;
}

export async function createAmenity(input: {
  communityId: string;
  name: string;
  description?: string;
  capacity: number;
  location?: string;
  requiresApproval?: boolean;
}): Promise<Amenity> {
  const { data } = await apiClient.post("/v1/amenities", {
    community_id: input.communityId,
    name: input.name,
    description: input.description,
    capacity: input.capacity,
    location: input.location,
    requires_approval: input.requiresApproval ?? false,
  });
  return data;
}
