"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "./notification.service";

export const notificationsKey = ["notifications"] as const;

export function useNotificationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: notificationsKey,
    queryFn: notificationService.listNotifications,
    enabled,
  });
}

export function useMarkNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData(notificationsKey, (old: { lu: boolean }[] | undefined) =>
        old?.map((n) => ({ ...n, lu: true })) ?? [],
      );
    },
  });
}
