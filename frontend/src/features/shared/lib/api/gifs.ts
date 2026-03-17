// fetch gifs from the api
import { fetchJson } from "@/src/lib/apiClient";
import type { Gif } from "@/src/features/shared/lib/api/gifs.types";

type KlipyListResponse = {
  data?: Gif[];
  results?: Gif[];
};

type KlipyDetailResponse = {
  data?: Gif;
} & Gif;

function extractGifList(payload: KlipyListResponse | Gif[] | undefined): Gif[] {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  const anyPayload = payload as Record<string, unknown>;

  if (Array.isArray(anyPayload.data)) return anyPayload.data;
  if (Array.isArray(anyPayload.results)) return anyPayload.results;

  if (anyPayload.data) {
    if (Array.isArray(anyPayload.data.data)) return anyPayload.data.data;
    if (Array.isArray(anyPayload.data.results)) return anyPayload.data.results;
  }

  if (anyPayload.results) {
    if (Array.isArray(anyPayload.results.data)) return anyPayload.results.data;
    if (Array.isArray(anyPayload.results.results)) return anyPayload.results.results;
  }

  return [];
}

function extractGif(payload: KlipyDetailResponse | Gif | undefined): Gif {
  if (!payload) {
    throw new Error("GIF introuvable");
  }

  if ("id" in payload) {
    return payload as Gif;
  }

  const withData = payload as KlipyDetailResponse;
  if (withData && withData.data) {
    return withData.data as Gif;
  }

  throw new Error("GIF introuvable");
}

export async function searchGifs(query: string): Promise<Gif[]> {
  const raw = await fetchJson<KlipyListResponse | Gif[]>(
    `/gifs/search?q=${encodeURIComponent(query)}`,
    {
      method: "GET",
    },
  );
  return extractGifList(raw);
}

export async function fetchTrendingGifs(): Promise<Gif[]> {
  const raw = await fetchJson<KlipyListResponse | Gif[]>("/gifs/trending", {
    method: "GET",
  });
  return extractGifList(raw);
}

export async function fetchGifById(id: string): Promise<Gif> {
  const raw = await fetchJson<KlipyDetailResponse | Gif>(
    `/gifs/${encodeURIComponent(id)}`,
    {
      method: "GET",
    },
  );
  return extractGif(raw);
}