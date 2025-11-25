// src/app/components/AppEditForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { initI18n } from "@/i18n/i18n";
import { AppInfo } from "@/src-tauri/invoke";
import { selectIconFile } from "@/src-tauri/invoke"; // selectIconFileをインポート
import styles from "./AppEditForm/style.module.css";

interface AppEditFormProps {
  appInfo: AppInfo | null; // appInfo can be null now
  onAdd: (appInfo: AppInfo) => void;
  onCancel: () => void;
}

const TRANSITION_DURATION = 300; // ms, matches CSS transition duration

export default function AppEditForm({
  appInfo,
  onAdd,
  onCancel,
}: AppEditFormProps) {
  const { t } = initI18n();
  // Initialize editedAppInfo only when appInfo is provided
  const [editedAppInfo, setEditedAppInfo] = useState<AppInfo>(
    appInfo || { id: "", name: "", url: "", icon: null, description: null }, // Provide a default empty AppInfo
  );
  const [shouldRender, setShouldRender] = useState(appInfo !== null); // Controls actual DOM rendering

  // appInfoが変更されたら、editedAppInfoを更新
  useEffect(() => {
    if (appInfo) {
      // If appInfo is not null, it means the dialog should be open
      setShouldRender(true);
      setEditedAppInfo(appInfo);
    } else {
      // If appInfo is null, it means the dialog should be closing
      const timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, TRANSITION_DURATION);
      return () => clearTimeout(timeoutId);
    }
  }, [appInfo]);

  if (!shouldRender) return null; // Only render if shouldRender is true

  const isEditing = editedAppInfo.id !== undefined && editedAppInfo.id !== ""; // idがあれば編集モード

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditedAppInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClick = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(editedAppInfo);
  };

  const handleSelectIconFile = async () => {
    try {
      const filePath = await selectIconFile();
      if (filePath) {
        setEditedAppInfo((prev) => ({ ...prev, icon: "file://" + filePath }));
      }
    } catch (error) {
      console.error("Failed to select icon file:", error);
      alert(`Failed to select icon file: ${error}`);
    }
  };

  return (
    <div
      className={`${styles.overlay} ${
        appInfo !== null ? styles["overlay-visible"] : ""
      }`}
    >
      <div className={styles.dialog}>
        <h2 className={styles.title}>
          {isEditing ? t("edit_app_dialog_title") : t("add_app_dialog_title")}
        </h2>
        <form onSubmit={handleAddClick}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              {t("app_name")}
            </label>
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
            <label htmlFor="url" className={styles.label}>
              {t("app_url")}
            </label>
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
            <label htmlFor="icon" className={styles.label}>
              {t("app_icon")}
            </label>
            {editedAppInfo.icon && (
              <div className={styles.iconPreview}>
                {editedAppInfo.icon.startsWith("file://") ? (
                  <img
                    src={editedAppInfo.icon}
                    alt="App Icon"
                    width={64}
                    height={64}
                  />
                ) : (
                  <Image
                    src={editedAppInfo.icon}
                    alt="App Icon"
                    width={64}
                    height={64}
                  />
                )}
              </div>
            )}
            <div className={styles.iconInputGroup}>
              <input
                type="text"
                id="icon"
                name="icon"
                value={editedAppInfo.icon || ""}
                onChange={handleChange}
                placeholder={t("app_icon_url_placeholder")}
                className={styles.input}
              />
              <button
                type="button"
                onClick={handleSelectIconFile}
                className={styles.secondaryButtonFile}
              >
                {t("choose_file")}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              {t("app_description")}
            </label>
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
            <button
              type="button"
              onClick={onCancel}
              className={styles.secondaryButton}
            >
              {t("cancel")}
            </button>
            <button type="submit" className={styles.primaryButton}>
              {isEditing ? t("save_changes") : t("add_app")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
