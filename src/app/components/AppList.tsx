"use client";

import { useEffect, useState } from "react";
import { initI18n } from "@/i18n/i18n";
import AppBox from "./AppList/AppBox";
import NoApps from "./AppList/NoApps";
import { listDir, getFile } from "@/src-tauri/invoke";

type AppData = {
  name?: string;
  title?: string;
  description?: string;
  icon?: string;
  [k: string]: unknown;
};
export type AppEntry = { id: string; data: AppData }; // AppEntryをエクスポートする

interface AppListProps {
  refreshTrigger: number; // refreshTriggerプロップを追加
  onEdit: (app: AppEntry) => void; // onEditプロップを追加
}

export default function AppList({ refreshTrigger, onEdit }: AppListProps) {
  const { t } = initI18n();
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const appsDir = "apps"; // relative to ~/.web-launcher

    async function walkDir(rel: string) {
      if (!mounted) return; // コンポーネントがアンマウントされていたら何もしない

      try {
        const entries: Array<{ name: string; type: string }> = await listDir(
          rel,
        );
        for (const entry of entries) {
          if (entry.type === "Directory") {
            const childRel = rel ? `${rel}/${entry.name}` : entry.name;
            // try to read application.json in this directory
            try {
              const filePath = `${childRel}/application.json`;
              const raw: string = await getFile(filePath);
              const data = JSON.parse(raw);
              if (mounted) {
                // `id`フィールドを`AppInfo`構造体から取得するように変更
                // ここでは`id`は`childRel`から取得できると仮定
                const id = childRel.split("/").pop() || childRel; // 例: apps/xxx/application.json -> xxx
                setApps((s) => [...s, { id: id, data }]);
              }
            } catch {
              // not necessarily an error - file may not exist; ignore
            }
            // recurse
            await walkDir(childRel);
          }
        }
      } catch (e) {
        throw e;
      }
    }

    (async () => {
      if (!mounted) return;
      setLoading(true); // ロード開始
      setApps([]); // リストをクリア
      setError(null); // エラーをクリア
      try {
        await walkDir(appsDir);
        if (mounted) setLoading(false);
      } catch (e) {
        if (mounted) {
          setError((e as Error).message || String(e));
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [refreshTrigger]); // refreshTriggerを依存配列に追加

  if (loading) return <div>{t("apps_loading")}</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  if (apps.length === 0) {
    return <NoApps />;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {apps.map((a) => (
        <AppBox key={a.id} info={a} onEdit={onEdit} />
      ))}
    </div>
  );
}
