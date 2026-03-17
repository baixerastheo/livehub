 "use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  placeholder,
  onGifSelect,
}: Props) {
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const t = useTranslations("messages");
  const resolvedPlaceholder = placeholder ?? t("sendMessagePlaceholder");

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
            aria-label={t("addAttachment")}
          >
            <FiPlus />
          </button>
        </div>

        <input
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={resolvedPlaceholder}
          aria-label={resolvedPlaceholder}
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
