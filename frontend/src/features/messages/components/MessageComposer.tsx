"use client";

import styles from "../styles/MessageComposer.module.css";
import { FiPlus, FiSmile } from "react-icons/fi";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
};

export function MessageComposer({
  value,
  onChange,
  onSubmit,
  placeholder = "Envoyer un message…",
}: Props) {
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
          <div className={styles.composerDivider} aria-hidden="true" />
        </div>

        <input
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Message input"
        />

        <div className={styles.composerActions}>
          <button
            type="button"
            className={styles.composerIconButton}
            aria-label="Emoji"
          >
            <FiSmile />
          </button>
        </div>

        <button type="submit" style={{ display: "none" }} aria-hidden="true">
          Send
        </button>
      </div>
    </form>
  );
}
