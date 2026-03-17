"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTrendingGifs, searchGifs } from "../lib/api/gifs";
import type { Gif } from "../lib/api/gifs.types";

const gifsKeys = {
  trending: ["gifs", "trending"] as const,
  search: (query: string) => ["gifs", "search", query] as const,
};

export function useTrendingGifs() {
  const query = useQuery<Gif[]>({
    queryKey: gifsKeys.trending,
    queryFn: () => fetchTrendingGifs(),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useGifSearch(query: string) {
  const enabled = query.trim().length > 0;

  const searchQuery = useQuery<Gif[]>({
    queryKey: gifsKeys.search(query),
    queryFn: () => searchGifs(query),
    enabled,
  });

  return {
    data: searchQuery.data ?? [],
    isLoading: searchQuery.isLoading,
    error: searchQuery.error,
    refetch: searchQuery.refetch,
  };
}

