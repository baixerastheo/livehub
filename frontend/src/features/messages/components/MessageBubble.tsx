"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { FiMoreHorizontal, FiTrash2, FiSmile, FiEdit2 } from "react-icons/fi";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import styles from "../styles/MessageBubble.module.css";
import type { ChatMessage } from "@/src/features/messages/messages.mock";
import { ReactionBar } from "@/src/features/messages/components/ReactionBar";
import { UserAvatar } from "@/src/features/shared/components/avatar/UserAvatar";

const PICKER_WIDTH = 352;
const PICKER_HEIGHT = 440;
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getFixedStyle(
  anchor: DOMRect,
  contentWidth: number,
  contentHeight: number,
): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceBelow = vh - anchor.bottom - 8;
  const spaceAbove = anchor.top - 8;

  const top =
    spaceBelow >= contentHeight || spaceBelow >= spaceAbove
      ? anchor.bottom + 4
      : anchor.top - contentHeight - 4;

  // right-align to the anchor, but don't overflow left edge
  const rightFromEdge = vw - anchor.right;
  const leftEdge = anchor.right - contentWidth;
  const left = leftEdge < 8 ? 8 : undefined;
  const right = leftEdge < 8 ? undefined : rightFromEdge;

  return { position: "fixed", top, left, right, zIndex: 9999 };
}

type MenuState = "closed" | "menu" | "picker";

type Props = {
  message: ChatMessage;
  showAvatar?: boolean;
  currentUserId?: string | null;
  canDelete?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
  onToggleReaction?: (messageId: number, emoji: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  membersById?: Record<string, string>;
};

function renderContent(
  content: string,
  membersById: Record<string, string>,
  currentUserId: string | null,
  mentionStyle: string,
  mentionMeStyle: string,
): React.ReactNode {
  const parts = content.split(/(@\[[a-z0-9-]+\])/gi);
  return parts.map((part, i) => {
    const match = /^@\[([a-z0-9-]+)\]$/i.exec(part);
    if (match) {
      const userId = match[1];
      const name = membersById[userId] ?? "unknown";
      const isMe = userId === currentUserId;
      return (
        <span key={i} className={`${mentionStyle} ${isMe ? mentionMeStyle : ""}`}>
          @{name}
        </span>
      );
    }
    return part;
  });
}

export function MessageBubble({
  message,
  showAvatar = true,
  currentUserId = null,
  canDelete = false,
  onDelete,
  isDeleting = false,
  onToggleReaction,
  onEdit,
  membersById = {},
}: Props) {
  const t = useTranslations("messages");
  const isMe = message.isMe ?? false;
  const reactions = message.reactions ?? [];

  const [menuState, setMenuState] = React.useState<MenuState>("closed");
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
  const [quickHover, setQuickHover] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("");
  const editRef = React.useRef<HTMLTextAreaElement>(null);

  const dotsRef = React.useRef<HTMLButtonElement>(null);
  const portalRef = React.useRef<HTMLDivElement>(null);

  const canEdit = isMe && !!onEdit;
  const hasActions = onToggleReaction || (canDelete && onDelete) || canEdit;

  const startEdit = () => {
    setEditValue(message.content);
    setIsEditing(true);
    setMenuState("closed");
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const submitEdit = () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === message.content) {
      cancelEdit();
      return;
    }
    onEdit?.(message.id, trimmed);
    setIsEditing(false);
  };

  React.useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [isEditing]);

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitEdit();
    }
    if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const openMenu = () => {
    if (menuState !== "closed") {
      setMenuState("closed");
      return;
    }
    if (dotsRef.current) {
      setAnchorRect(dotsRef.current.getBoundingClientRect());
    }
    setMenuState("menu");
  };

  React.useEffect(() => {
    if (menuState === "closed") {
      setQuickHover(false);
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        dotsRef.current?.contains(target) ||
        portalRef.current?.contains(target)
      )
        return;
      setMenuState("closed");
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuState]);

  // Recalculate anchor on scroll/resize while open
  React.useEffect(() => {
    if (menuState === "closed" || !dotsRef.current) return;
    const update = () => {
      if (dotsRef.current) setAnchorRect(dotsRef.current.getBoundingClientRect());
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [menuState]);

  const dropdownItemCount = (onToggleReaction ? 1 : 0) + (canEdit ? 1 : 0) + (canDelete && onDelete ? 1 : 0);
  const dropdownStyle = anchorRect
    ? getFixedStyle(anchorRect, 180, dropdownItemCount * 40 + 12)
    : undefined;

  const pickerStyle = anchorRect
    ? getFixedStyle(anchorRect, PICKER_WIDTH, PICKER_HEIGHT)
    : undefined;

  return (
    <div
      className={`${styles.bubbleRow} ${isMe ? styles.bubbleRowMe : ""}`}
      role="listitem"
    >
      {!isMe && (
        <div className={styles.avatarCol}>
          {showAvatar ? (
            <UserAvatar
              avatarUrl={message.authorAvatarUrl}
              displayName={message.author}
              size="sm"
              aria-hidden
            />
          ) : (
            <div className={styles.avatarPlaceholder} />
          )}
        </div>
      )}
      <div className={styles.bubbleWrapper}>
        {showAvatar && (
          <div className={`${styles.bubbleMeta} ${isMe ? styles.bubbleMetaMe : ""}`}>
            <span className={styles.author}>
              {isMe ? t("you") : message.author}
            </span>
            <span className={styles.time}>
              {formatTime(message.createdAtIso)}
            </span>
          </div>
        )}
        <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : ""}`}>
          {hasActions && (
            <button
              ref={dotsRef}
              type="button"
              className={styles.dotsButton}
              onClick={openMenu}
              aria-label="Message actions"
              title="Message actions"
            >
              <FiMoreHorizontal size={15} aria-hidden />
            </button>
          )}
          {isEditing ? (
            <div className={styles.editForm}>
              <textarea
                ref={editRef}
                className={styles.editTextarea}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                rows={Math.max(1, editValue.split("\n").length)}
              />
              <div className={styles.editActions}>
                <span className={styles.editHint}>{t("editHint")}</span>
                <button type="button" className={styles.editCancelBtn} onClick={cancelEdit}>
                  {t("cancel")}
                </button>
                <button type="button" className={styles.editSaveBtn} onClick={submitEdit}>
                  {t("save")}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.text}>
              {message.content.startsWith("[gif]") ? (
                <img
                  src={message.content.slice(5)}
                  alt="GIF"
                  className={styles.gifImage}
                />
              ) : message.content.startsWith("[img]") ? (
                <img
                  src={message.content.slice(5)}
                  alt=""
                  className={styles.gifImage}
                />
              ) : (
                renderContent(message.content, membersById, currentUserId, styles.mention, styles.mentionMe)
              )}
              {message.editedAtIso && (
                <span className={styles.editedBadge}>{t("edited")}</span>
              )}
            </div>
          )}

          {reactions.length > 0 && (
            <ReactionBar
              reactions={reactions}
              currentUserId={currentUserId}
              onToggle={(emoji) => onToggleReaction?.(Number(message.id), emoji)}
            />
          )}
        </div>
      </div>

      {menuState === "menu" && anchorRect &&
        createPortal(
          <div ref={portalRef} style={dropdownStyle} className={styles.dropdown}>
            {onToggleReaction && (
              <div
                className={styles.dropdownItem}
                onMouseEnter={() => setQuickHover(true)}
                onMouseLeave={() => setQuickHover(false)}
                onClick={() => {
                  if (!quickHover) {
                    if (dotsRef.current) {
                      setAnchorRect(dotsRef.current.getBoundingClientRect());
                    }
                    setMenuState("picker");
                  }
                }}
              >
                {quickHover ? (
                  <div className={styles.quickEmojiRow}>
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={styles.quickEmojiBtn}
                        onClick={() => {
                          onToggleReaction(Number(message.id), emoji);
                          setMenuState("closed");
                          setQuickHover(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={styles.quickEmojiBtn}
                      title={t("addReaction")}
                      onClick={() => {
                        if (dotsRef.current) {
                          setAnchorRect(dotsRef.current.getBoundingClientRect());
                        }
                        setMenuState("picker");
                        setQuickHover(false);
                      }}
                    >
                      <FiSmile size={13} aria-hidden />
                    </button>
                  </div>
                ) : (
                  <>
                    <FiSmile size={14} aria-hidden />
                    {t("addReaction")}
                  </>
                )}
              </div>
            )}
            {canEdit && (
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={startEdit}
              >
                <FiEdit2 size={14} aria-hidden />
                {t("editMessage")}
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                onClick={() => {
                  setMenuState("closed");
                  onDelete();
                }}
                disabled={isDeleting}
              >
                <FiTrash2 size={14} aria-hidden />
                {isDeleting ? t("deleting") : t("deleteMessage")}
              </button>
            )}
          </div>,
          document.body,
        )}

      {menuState === "picker" && anchorRect &&
        createPortal(
          <div ref={portalRef} style={pickerStyle}>
            <Picker
              data={data}
              onEmojiSelect={(e: { native: string }) => {
                onToggleReaction?.(Number(message.id), e.native);
                setMenuState("closed");
              }}
              theme="light"
              previewPosition="none"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
