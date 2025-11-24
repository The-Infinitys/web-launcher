"use client";

import Image from "next/image";
import { initI18n } from "@/i18n/i18n";
import style from "./NewApp/style.module.css";
export default function NewApp() {
  const { t } = initI18n();
  return (
    <button
      id="new-app"
      name="new-app"
      type="button"
      aria-label={t("new_app")}
      className={style["newapp"]}
    >
      <Image src="/new.svg" width={32} height={32} alt={t("new_app")} />
      <span className="sr-only">{t("new_app")}</span>
    </button>
  );
}
