"use client";

import React from "react";
import { useTranslations } from "next-intl";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import styles from "../styles/AvatarCropModal.module.css";

type AvatarCropModalProps = {
  src: string;
  onConfirm: (file: File) => void;
  onClose: () => void;
};

function centerSquareCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
    width,
    height,
  );
}

async function cropToFile(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<File> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const size = Math.min(crop.width, crop.height);
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.92,
    );
  });
}

export function AvatarCropModal({ src, onConfirm, onClose }: AvatarCropModalProps) {
  const t = useTranslations("server");
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerSquareCrop(width, height));
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    setIsProcessing(true);
    try {
      const file = await cropToFile(imgRef.current, completedCrop);
      onConfirm(file);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      aria-modal="true"
      role="dialog"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t("cropTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("cropCancel")}
            className={styles.closeButton}
          >
            ×
          </button>
        </div>

        <div className={styles.cropArea}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
            minWidth={60}
            minHeight={60}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="À recadrer"
              className={styles.cropImage}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            {t("cropCancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !completedCrop}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            {isProcessing ? t("cropProcessing") : t("cropConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
