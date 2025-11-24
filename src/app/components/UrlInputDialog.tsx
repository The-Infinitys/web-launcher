// src/app/components/UrlInputDialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import { initI18n } from "@/i18n/i18n";
import styles from "./UrlInputDialog/style.module.css";

interface UrlInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

const TRANSITION_DURATION = 300; // ms, matches CSS transition duration

export default function UrlInputDialog({
  isOpen,
  onClose,
  onSubmit,
}: UrlInputDialogProps) {
  const { t } = initI18n();
  const [url, setUrl] = useState("");
  const [shouldRender, setShouldRender] = useState(isOpen); // Controls actual DOM rendering

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true); // When dialog should be open, render immediately
    } else {
      // When dialog should be closed, wait for transition to finish before unmounting
      const timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, TRANSITION_DURATION);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  if (!shouldRender) return null; // Only render if shouldRender is true

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      onSubmit(url);
      setUrl(""); // URLをクリア
      onClose(); // ダイアログを閉じる
    }
  };

  const handleCancel = () => {
    setUrl(""); // URLをクリア
    onClose(); // ダイアログを閉じる
  };

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles["overlay-visible"] : ""}`}
    >
      <div className={styles.dialog}>
        <h2 className={styles.title}>{t("input_url_dialog_title")}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("input_url_placeholder")}
            className={styles.input}
            required
          />
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.secondaryButton}
            >
              {t("cancel")}
            </button>
            <button type="submit" className={styles.primaryButton}>
              {t("get_info")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
