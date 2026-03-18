"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import styles from "../styles/MessageComposer.module.css";
import { FiPlus, FiSmile } from "react-icons/fi";
import { MdOutlineGif } from "react-icons/md";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
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
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("messages");
  const resolvedPlaceholder = placeholder ?? t("sendMessagePlaceholder");

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? value.length;
    const next = value.slice(0, cursor) + emoji + value.slice(cursor);
    onChange(next);
    setIsEmojiPickerOpen(false);
    // restore focus + cursor after React re-render
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(cursor + emoji.length, cursor + emoji.length);
    });
  };

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
          ref={inputRef}
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
          className={styles.composerIconButton}
          aria-label="Add emoji"
          onClick={() => {
            setIsGifPickerOpen(false);
            setIsEmojiPickerOpen((prev) => !prev);
          }}
        >
          <FiSmile />
        </button>

        <button
          type="button"
          className={styles.composerGifButton}
          aria-label="Add GIF"
          onClick={() => {
            setIsEmojiPickerOpen(false);
            setIsGifPickerOpen((prev) => !prev);
          }}
        >
          <MdOutlineGif />
        </button>
      </div>

      {isEmojiPickerOpen && (
        <div className={styles.emojiPickerPopover}>
          <Picker
            data={data}
            onEmojiSelect={(e: { native: string }) => insertEmoji(e.native)}
            theme="light"
            previewPosition="none"
          />
        </div>
      )}

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
