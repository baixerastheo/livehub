"use client";

import { useRef } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { useProfile, useUploadAvatarMutation } from "../profile.hooks";
import { profileService } from "../profile.service";
import styles from "../styles/ProfileSection.module.css";

const DEFAULT_AVATAR_SRC = "/icons/avatar-default.svg";

export function ProfileSection() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const uploadMutation = useUploadAvatarMutation(userId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  const canSave = useMemo(() => {
    return name.trim().length > 0 || bio.trim().length > 0;
  }, [bio, name]);

  const avatarUrl = profile?.avatarUrl ?? null;
  const isUploading = uploadMutation.isPending;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const accepted = profileService.getAcceptedAvatarTypes();
    if (!accepted.split(",").some((t) => file.type === t.trim())) {
      return;
    }
    uploadMutation.mutate(file);
    e.target.value = "";
  };

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

        <div className={styles.avatarBlock}>
          <div className={styles.avatarPreview}>
            {profileLoading ? (
              <div className={styles.avatarPlaceholder} />
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className={styles.avatarImage}
              />
            ) : (
              <Image
                src={DEFAULT_AVATAR_SRC}
                alt=""
                width={80}
                height={80}
                className={styles.avatarImage}
              />
            )}
          </div>
          <div className={styles.avatarActions}>
            <input
              ref={fileInputRef}
              type="file"
              accept={profileService.getAcceptedAvatarTypes()}
              onChange={handleAvatarChange}
              className={styles.avatarInput}
              aria-label="Choisir une photo"
            />
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? "Envoi…" : "Changer la photo"}
            </button>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="profile-name">
              Name
            </label>
            <input
              id="profile-name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
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

