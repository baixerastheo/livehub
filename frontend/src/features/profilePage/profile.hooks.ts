"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserQuery } from "@/src/features/users/users.hooks";
import { usersKeys } from "@/src/features/users/users.types";
import { profileService } from "./profile.service";

export function useProfile(userId: string | undefined) {
  return useUserQuery(userId ?? undefined);
}

/**
 * Mutation to upload the avatar. Invalidate the profile and the users lists after success.
 */
export function useUploadAvatarMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
      }
      void queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
