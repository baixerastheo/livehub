 "use client";

import React from "react";
import styles from "../styles/MessageComposer.module.css";
import { FiPlus } from "react-icons/fi";
import { MdOutlineGif } from "react-icons/md";
import type { Gif } from "@/src/features/shared/lib/api/gifs.types";
import { GifPicker } from "./GifPicker";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  onGifSelect?: (gif: Gif) => void;
};

export function MessageComposer({
  value,
  onChange,
  onSubmit,
  placeholder = "Envoyer un message…",
  onGifSelect,
}: Props) {
  const [isGifPickerOpen, setIsGifPickerOpen] = React.useState(false);

  return (
    <form
      className={styles.composer}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className={styles.composerBar}>
        <div className={styles.composerLeft}>
          <button
            type="button"
            className={styles.composerIconButton}
            aria-label="Add attachment"
          >
            <FiPlus />
          </button>
        </div>

        <input
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Message input"
        />

        <button type="submit" style={{ display: "none" }} aria-hidden="true">
          Send
        </button>

        <button
          type="button"
          className={styles.composerGifButton}
          aria-label="Add GIF"
          onClick={() => setIsGifPickerOpen((prev) => !prev)}
        >
          <MdOutlineGif />
        </button>
      </div>

      {isGifPickerOpen && (
        <div className={styles.gifPickerPopover}>
          <GifPicker
            onSelect={(gif) => {
              onGifSelect?.(gif);
              setIsGifPickerOpen(false);
            }}
            onClose={() => setIsGifPickerOpen(false)}
          />
        </div>
      )}
    </form>
  );
}
