import { apiClient } from "./client";
import type { Announcement } from "../types";

export async function listAnnouncements(): Promise<Announcement[]> {
  const { data } = await apiClient.get("/v1/announcements");
  return data.announcements ?? data.items ?? data ?? [];
}

export async function acknowledgeAnnouncement(
  announcementId: string,
  userId: string
): Promise<void> {
  await apiClient.post(`/v1/announcements/${announcementId}/ack`, { userId });
}

export async function voteOnPoll(
  pollId: string,
  userId: string,
  selectedOption: string
): Promise<void> {
  await apiClient.post(`/v1/announcements/polls/${pollId}/votes`, {
    userId,
    selectedOption,
  });
}
