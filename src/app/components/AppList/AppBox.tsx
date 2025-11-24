import styles from "./style.module.css";

type AppData = {
  name?: string;
  title?: string;
  description?: string;
  icon?: string;
  [k: string]: unknown;
};
type AppEntry = { id: string; data: AppData };

export default function AppBox({ info }: { info: AppEntry }) {
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
    </div>
  );
}
