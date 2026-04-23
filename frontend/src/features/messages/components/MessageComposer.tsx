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
import { useToastStore } from "@/src/core/store/toast/useToastStore";

export type MentionMember = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (transformed: string) => void;
  placeholder?: string;
  onGifSelect?: (gif: Gif) => void;
  onImageSelect?: (file: File) => void;
  members?: MentionMember[];
};

export function MessageComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  onGifSelect,
  onImageSelect,
  members = [],
}: Props) {
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAtPos, setMentionAtPos] = useState<number>(-1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pendingMentions, setPendingMentions] = useState<Map<string, string>>(new Map());
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const match = /@([^\s@]*)$/.exec(before);
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
    setPendingMentions((prev) => {
      const updated = new Map(prev);
      for (const name of updated.keys()) {
        if (!next.includes(`@${name}`)) updated.delete(name);
      }
      return updated.size !== prev.size ? updated : prev;
    });
  };

  const insertMention = (member: MentionMember) => {
    const cursor = inputRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, mentionAtPos);
    const after = value.slice(cursor);
    const newValue = `${before}@${member.name} ${after}`;
    onChange(newValue);
    setPendingMentions((prev) => new Map(prev).set(member.name, member.id));
    setMentionQuery(null);
    setMentionAtPos(-1);
    // Restore focus after React re-render
    requestAnimationFrame(() => {
      const newCursor = mentionAtPos + member.name.length + 2; // @ + name + space
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

  const transformMentions = (text: string): string => {
    let result = text;
    pendingMentions.forEach((userId, name) => {
      result = result.replaceAll(`@${name}`, `@[${userId}]`);
    });
    return result;
  };

  const handleImageFile = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      useToastStore.getState().push({ type: "error", message: "Format non supporté (JPEG, PNG, WebP, GIF uniquement)" });
      return;
    }
    onImageSelect?.(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((i) => i.kind === "file" && ACCEPTED_IMAGE_TYPES.includes(i.type));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        handleImageFile(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
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
      className={`${styles.composer} ${isDragOver ? styles.composerDragOver : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (mentionQuery === null) {
          onSubmit(transformMentions(value));
          setPendingMentions(new Map());
        }
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = "";
        }}
      />
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
            onClick={() => fileInputRef.current?.click()}
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
          onPaste={handlePaste}
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
