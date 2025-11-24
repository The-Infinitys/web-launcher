import { initI18n } from "@/i18n/i18n";
import styles from "./style.module.css";
export default function NoApps() {
  const { t } = initI18n();

  const handleAddAppClick = () => {
    // 既存のスクロール処理
    const el = document.getElementById("new-app");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLElement).focus();
    }
    // カスタムイベントをディスパッチして、ダイアログを開く
    document.dispatchEvent(new CustomEvent("open-url-input-dialog"));
  };

  return (
    <div className={styles.noApps}>
      <div className="text-lg font-semibold">{t("noapps_title")}</div>
      <div className={styles.appDesc}>{t("noapps_description")}</div>
      <button
        type="button"
        className={styles.primaryButton}
        onClick={handleAddAppClick} // クリックハンドラを変更
      >
        {t("noapps_add")}
      </button>
    </div>
  );
}
