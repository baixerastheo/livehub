"use client";

import React from "react";
import styles from "./ToastHost.module.css";
import { useToastStore } from "@/src/core/store/toast/useToastStore";

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  React.useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((t) =>
      window.setTimeout(() => dismiss(t.id), 3500),
    );

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [dismiss, toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.host} aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
          <div className={styles.message}>{t.message}</div>
          <button
            type="button"
            className={styles.close}
            aria-label="Dismiss"
            onClick={() => dismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

