"use client";

import { useRef } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FiCamera } from "react-icons/fi";
import { useAuth } from "@/src/core/store/auth/useAuth";
import { useProfile, useUploadAvatarMutation } from "../profile.hooks";
import { profileService } from "../profile.service";
import styles from "../styles/ProfileSection.module.css";

const DEFAULT_AVATAR_SRC = "/icons/avatar-default.svg";

export function ProfileSection() {
  const t = useTranslations("profile");
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
            <div className={styles.cardTitle}>{t("profile")}</div>
            <div className={styles.cardSubtle}>{t("profileSubtitle")}</div>
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
            {t("save")}
          </button>
        </div>

        <div className={styles.avatarBlock}>
          <div
            className={`${styles.avatarHoverArea} ${
              isUploading ? styles.avatarHoverDisabled : ""
            }`}
            onClick={() => {
              if (!isUploading) {
                fileInputRef.current?.click();
              }
            }}
          >
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
            <div className={styles.avatarOverlay}>
              {!isUploading ? (
                <>
                  <FiCamera
                    className={styles.avatarOverlayIcon}
                    aria-hidden="true"
                  />
                  <span className={styles.avatarOverlayText}>
                    {t("changeAvatar")}
                  </span>
                </>
              ) : (
                <span className={styles.avatarOverlayText}>{t("uploading")}</span>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={profileService.getAcceptedAvatarTypes()}
            onChange={handleAvatarChange}
            className={styles.avatarInput}
            aria-label="Choisir une photo"
          />
        </div>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="profile-name">
              {t("name")}
            </label>
            <input
              id="profile-name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="profile-email">
              {t("email")}
            </label>
            <input
              id="profile-email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
            />
          </div>

          <div className={styles.fieldWide}>
            <label className={styles.label} htmlFor="profile-bio">
              {t("bio")}
            </label>
            <textarea
              id="profile-bio"
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("bioPlaceholder")}
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>{t("dangerZone")}</div>
            <div className={styles.cardSubtle}>{t("dangerZoneSubtitle")}</div>
          </div>
        </div>

        <div className={styles.dangerRow}>
          <div>
            <div className={styles.dangerTitle}>{t("deleteAccount")}</div>
            <div className={styles.cardSubtle}>{t("deleteAccountSubtitle")}</div>
          </div>
          <button type="button" className={styles.dangerButton}>
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

