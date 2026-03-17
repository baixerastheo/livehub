// fetch gifs from the api
import { fetchJson } from "@/src/lib/apiClient";
import type { Gif } from "@/src/features/shared/lib/api/gifs.types";

type KlipyListResponse = {
  result?: boolean;
  data?: Gif[] | { data?: Gif[]; results?: Gif[] };
  results?: Gif[] | { data?: Gif[]; results?: Gif[] };
};

type KlipyDetailResponse = {
  data?: Gif;
} & Gif;

function extractGifList(payload: KlipyListResponse | Gif[] | undefined): Gif[] {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;

  if (payload.data && !Array.isArray(payload.data)) {
    if (Array.isArray(payload.data.data)) return payload.data.data;
    if (Array.isArray(payload.data.results)) return payload.data.results;
  }

  if (payload.results && !Array.isArray(payload.results)) {
    if (Array.isArray(payload.results.data)) return payload.results.data;
    if (Array.isArray(payload.results.results)) return payload.results.results;
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