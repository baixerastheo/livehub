"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import styles from "../styles/MessageComposer.module.css";
import { FiPlus, FiSmile } from "react-icons/fi";
import { MdOutlineGif } from "react-icons/md";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import type { Gif } from "@/src/features/shared/lib/api/gifs.types";
import { GifPicker } from "./GifPicker";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";

export type MentionMember = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  onGifSelect?: (gif: Gif) => void;
  members?: MentionMember[];
};

export function MessageComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  onGifSelect,
  members = [],
}: Props) {
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAtPos, setMentionAtPos] = useState<number>(-1);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("messages");
  const resolvedPlaceholder = placeholder ?? t("sendMessagePlaceholder");

  const filteredMembers =
    mentionQuery !== null
      ? members.filter((m) =>
          m.name.toLowerCase().includes(mentionQuery.toLowerCase()),
        )
      : [];

  // Detect @mention being typed at cursor position
  const detectMention = (text: string, cursor: number) => {
    const before = text.slice(0, cursor);
    const match = /@([\w]*)$/.exec(before);
    if (match) {
      setMentionQuery(match[1]);
      setMentionAtPos(match.index);
      setActiveIndex(0);
    } else {
      setMentionQuery(null);
      setMentionAtPos(-1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    onChange(next);
    detectMention(next, e.target.selectionStart ?? next.length);
  };

  const insertMention = (member: MentionMember) => {
    const cursor = inputRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, mentionAtPos);
    const after = value.slice(cursor);
    const newValue = `${before}@[${member.id}] ${after}`;
    onChange(newValue);
    setMentionQuery(null);
    setMentionAtPos(-1);
    // Restore focus after React re-render
    requestAnimationFrame(() => {
      const newCursor = mentionAtPos + member.id.length + 4; // @[] + space
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(newCursor, newCursor);
    });
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? value.length;
    const next = value.slice(0, cursor) + emoji + value.slice(cursor);
    onChange(next);
    setIsEmojiPickerOpen(false);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(cursor + emoji.length, cursor + emoji.length);
    });
  };

  // Keyboard navigation in mention dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery === null || filteredMembers.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const member = filteredMembers[activeIndex];
      if (member) insertMention(member);
    } else if (e.key === "Escape") {
      setMentionQuery(null);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (mentionQuery === null) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setMentionQuery(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mentionQuery]);

  return (
    <form
      className={styles.composer}
      onSubmit={(e) => {
        e.preventDefault();
        if (mentionQuery === null) onSubmit();
      }}
    >
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div ref={dropdownRef} className={styles.mentionDropdown}>
          {filteredMembers.slice(0, 8).map((member, i) => (
            <div
              key={member.id}
              className={`${styles.mentionItem} ${i === activeIndex ? styles.mentionItemActive : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(member);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <UserAvatar
                avatarUrl={member.avatarUrl}
                displayName={member.name}
                size="sm"
              />
              <span className={styles.mentionName}>{member.name}</span>
            </div>
          ))}
        </div>
      )}

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
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          aria-label={resolvedPlaceholder}
          autoComplete="off"
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
