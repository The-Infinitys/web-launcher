"use client";

import Image from "next/image";
import { initI18n } from "@/i18n/i18n";
import style from "./NewApp/style.module.css";
import React from "react"; // Reactをインポート

export default function NewApp() {
  const { t } = initI18n();

  const handleNewAppClick = () => {
    // カスタムイベントをディスパッチして、ダイアログを開く
    document.dispatchEvent(new CustomEvent('open-url-input-dialog'));
  };

  return (
    <button
      id="new-app"
      name="new-app"
      type="button"
      aria-label={t("new_app")}
      className={style["newapp"]}
      onClick={handleNewAppClick} // クリックハンドラを追加
    >
      <Image src="/new.svg" width={32} height={32} alt={t("new_app")} />
      <span className="sr-only">{t("new_app")}</span>
    </button>
  );
}
