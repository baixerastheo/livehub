import { fetchFormData } from "@/src/lib/apiClient";
import type { UploadAvatarResponseDto } from "./profile.types";

const AVATAR_PATH = "/users/me/avatar";
const ACCEPT_TYPES = "image/jpeg,image/png,image/webp";

export function getAcceptedAvatarTypes(): string {
  return ACCEPT_TYPES;
}

export async function uploadAvatar(file: File): Promise<UploadAvatarResponseDto> {
  const form = new FormData();
  form.append("file", file);
  return fetchFormData<UploadAvatarResponseDto>(AVATAR_PATH, form, "POST");
}

export const profileService = {
  uploadAvatar,
  getAcceptedAvatarTypes,
};
