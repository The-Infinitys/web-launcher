// src/app/components/UrlInputDialog.tsx
"use client";

import React, { useState } from "react";
import { initI18n } from "@/i18n/i18n";
import styles from "./UrlInputDialog/style.module.css";

interface UrlInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

export default function UrlInputDialog({
  isOpen,
  onClose,
  onSubmit,
}: UrlInputDialogProps) {
  const { t } = initI18n();
  const [url, setUrl] = useState("");

  if (!isOpen) return null;

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
    <div className={styles.overlay}>
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
