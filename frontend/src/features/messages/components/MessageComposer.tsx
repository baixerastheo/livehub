"use client";

import { useTranslations } from "next-intl";
import styles from "../styles/MessageComposer.module.css";
import { FiPlus } from "react-icons/fi";

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
  placeholder,
}: Props) {
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
      </div>
    </form>
  );
}
