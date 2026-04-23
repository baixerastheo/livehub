import { fetchJson } from "@/src/lib/apiClient";
import type { NotificationDto } from "./notification.types";

export async function listNotifications(): Promise<NotificationDto[]> {
  return fetchJson<NotificationDto[]>("/notifications", { method: "GET" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetchJson("/notifications/read-all", { method: "PATCH" });
}

export const notificationService = { listNotifications, markAllNotificationsRead };
