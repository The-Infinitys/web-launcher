// src/app/components/AppEditForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { initI18n } from "@/i18n/i18n";
import { AppInfo } from "@/src-tauri/invoke";
import styles from "./AppEditForm/style.module.css";

interface AppEditFormProps {
  appInfo: AppInfo;
  onAdd: (appInfo: AppInfo) => void;
  onCancel: () => void;
}

export default function AppEditForm({ appInfo, onAdd, onCancel }: AppEditFormProps) {
  const { t } = initI18n();
  const [editedAppInfo, setEditedAppInfo] = useState<AppInfo>(appInfo);

  // appInfoが変更されたら、editedAppInfoを更新
  useEffect(() => {
    setEditedAppInfo(appInfo);
  }, [appInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedAppInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClick = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(editedAppInfo);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h2 className={styles.title}>{t("edit_app_dialog_title")}</h2>
        <form onSubmit={handleAddClick}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>{t("app_name")}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={editedAppInfo.name}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="url" className={styles.label}>{t("app_url")}</label>
            <input
              type="url"
              id="url"
              name="url"
              value={editedAppInfo.url}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="icon" className={styles.label}>{t("app_icon")}</label>
            {editedAppInfo.icon && (
              <div className={styles.iconPreview}>
                <Image src={editedAppInfo.icon} alt="App Icon" width={64} height={64} />
              </div>
            )}
            <input
              type="text"
              id="icon"
              name="icon"
              value={editedAppInfo.icon || ""}
              onChange={handleChange}
              placeholder={t("app_icon_placeholder")}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>{t("app_description")}</label>
            <textarea
              id="description"
              name="description"
              value={editedAppInfo.description || ""}
              onChange={handleChange}
              placeholder={t("app_description_placeholder")}
              className={styles.textarea}
              rows={4}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onCancel} className={styles.secondaryButton}>
              {t("cancel")}
            </button>
            <button type="submit" className={styles.primaryButton}>
              {t("add_app")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
