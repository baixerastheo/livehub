 "use client";

import { useMemo, useState } from "react";
import { useAuthStore } from "@/src/core/store/auth/useAuthStore";
import styles from "../styles/ProfileSection.module.css";

export function ProfileSection() {
  const user = useAuthStore((state) => state.user);

  const initialUsername = user?.username ?? "";
  const initialEmail = user?.email ?? "";

  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState("");

  const canSave = useMemo(() => {
    return username.trim() !== initialUsername.trim() || bio.trim().length > 0;
  }, [bio, initialUsername, username]);

  return (
    <div className={styles.sectionStack}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Profile</div>
            <div className={styles.cardSubtle}>
              Basic information people see about you.
            </div>
          </div>
          <button
            type="button"
            className={`${styles.primaryButton} ${
              canSave ? "" : styles.primaryButtonDisabled
            }`}
            disabled={!canSave}
            onClick={() => {
                // TODO -> Save profile
            }}
          >
            Save
          </button>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="profile-username">
              Username
            </label>
            <input
              id="profile-username"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              className={styles.input}
              value={initialEmail}
              readOnly
            />
          </div>

          <div className={styles.fieldWide}>
            <label className={styles.label} htmlFor="profile-bio">
              Bio (optional)
            </label>
            <textarea
              id="profile-bio"
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people a little bit about you…"
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Danger zone</div>
            <div className={styles.cardSubtle}>
              Sensitive actions (you can implement later).
            </div>
          </div>
        </div>

        <div className={styles.dangerRow}>
          <div>
            <div className={styles.dangerTitle}>Delete account</div>
            <div className={styles.cardSubtle}>
              This action is irreversible.
            </div>
          </div>
          <button type="button" className={styles.dangerButton}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

