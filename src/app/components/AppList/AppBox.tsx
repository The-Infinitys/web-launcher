import styles from "./style.module.css";
import { AppEntry } from "../AppList"; // AppListからAppEntryをインポート

interface AppBoxProps {
  info: AppEntry;
  onEdit: (app: AppEntry) => void; // onEditプロップを追加
}

export default function AppBox({ info, onEdit }: AppBoxProps) {
  const { id, data } = info;
  const name = data.name ?? data.title ?? id;
  const description = data.description ?? "";
  const icon = data.icon ?? "/icon.svg";

  return (
    <div className={`${styles.appBox} flex-1 border rounded`}>
      <img src={icon} alt={`${name} icon`} className={styles.appIcon} />
      <div className="flex-1">
        <div className={styles.appTitle}>{name}</div>
        {description && <div className={styles.appDesc}>{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onEdit(info)} // 編集ボタンを追加
        className={styles.editButton}
      >
        Edit
      </button>
    </div>
  );
}
