import styles from "./style.module.css";
import { initI18n } from "@/i18n/i18n";

export default function NoApps() {
  const { t } = initI18n();
  return (
    <div className={styles.noApps}>
      <div className="text-lg font-semibold">{t("noapps_title")}</div>
      <div className={styles.appDesc}>{t("noapps_description")}</div>
      <button
        type="button"
        className={styles.primaryButton}
        onClick={() => {
          const el = document.getElementById("new-app");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            (el as HTMLElement).focus();
          }
        }}
      >
        {t("noapps_add")}
      </button>
    </div>
  );
}
