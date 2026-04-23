import { fetchFormData } from "@/src/lib/apiClient";

export async function uploadMessageImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  return fetchFormData<{ url: string }>("/messages/image", form);
}
