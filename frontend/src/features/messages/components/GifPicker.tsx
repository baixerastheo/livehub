"use client";

import React from "react";
import styles from "../styles/GifPicker.module.css";
import type { Gif } from "@/src/features/shared/lib/api/gifs.types";
import {
  useGifSearch,
  useTrendingGifs,
} from "@/src/features/shared/hooks/gifs.hooks";

type GifPickerProps = {
  onSelect: (gif: Gif) => void;
  onClose?: () => void;
};

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = React.useState("");

  const {
    data: trendingGifs,
    isLoading: isTrendingLoading,
    error: trendingError,
    refetch: refetchTrending,
  } = useTrendingGifs();

  const {
    data: searchResults,
    isLoading: isSearchLoading,
    error: searchError,
    refetch: refetchSearch,
  } = useGifSearch(query);

  const hasQuery = query.trim().length > 0;
  const gifsToDisplay = hasQuery ? searchResults : trendingGifs;
  const isLoading = hasQuery ? isSearchLoading : isTrendingLoading;
  const error = hasQuery ? searchError : trendingError;
  const refetch = hasQuery ? refetchSearch : refetchTrending;

  return (
    <div className={styles.picker}>
      <div className={styles.header}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un GIF"
          className={styles.searchInput}
        />
        {onClose && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close GIF picker"
          >
            ×
          </button>
        )}
      </div>

      <div className={styles.body}>
        {isLoading && (
          <div className={styles.state}>
            <span>Chargement des GIFs…</span>
          </div>
        )}

        {!isLoading && error && (
          <div className={styles.state}>
            <span>Impossible de charger les GIFs.</span>
            <button type="button" onClick={() => refetch()}>
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !error && gifsToDisplay.length === 0 && (
          <div className={styles.state}>
            <span>Aucun GIF trouvé (0 résultat côté API).</span>
          </div>
        )}

        {!isLoading && !error && gifsToDisplay.length > 0 && (
          <div className={styles.grid}>
            {gifsToDisplay.map((gif) => {
              const imageUrl =
                gif.file?.sm?.gif?.url ??
                gif.file?.md?.gif?.url ??
                gif.file?.hd?.gif?.url ??
                gif.src ??
                gif.proxy_src ??
                gif.url ??
                "";

              if (!imageUrl) return null;

              return (
                <button
                  key={gif.id}
                  type="button"
                  className={styles.gifCard}
                  onClick={() => onSelect(gif)}
                >
                  <img src={imageUrl} alt={gif.title || "GIF"} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

