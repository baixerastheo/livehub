"use client";

import { useAuth } from "@/src/core/store/auth/useAuth";
import { useProfile } from "@/src/features/profilePage/profile.hooks";
import { getDisplayName } from "@/src/features/shared/lib/displayName";
import { UserAvatar, type UserAvatarSize } from "./UserAvatar";

type Props = {
  size?: UserAvatarSize;
  className?: string;
};

export function CurrentUserAvatar({ size = "sm", className }: Props) {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);

  return (
    <UserAvatar
      avatarUrl={profile?.avatarUrl ?? user?.image ?? undefined}
      displayName={getDisplayName(user ?? {})}
      size={size}
      className={className}
    />
  );
}
