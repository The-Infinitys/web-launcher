"use client";
import { initI18n } from "@/i18n/i18n";

export default function AppList(){
  const { t } = initI18n("", "en");
    return <p>{t("app_not_fonud")}</p>
}