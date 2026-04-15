import { fetchJson } from "@/src/lib/apiClient";

export async function getVoiceToken(channelId: number) {
    return fetchJson<{ token: string, url: string }>(`/voice/token`, {
        method: "POST",
        body: { channelId },
    });
}