"use client";

import { useState, useEffect } from "react";
import AppList, { AppEntry } from "./components/AppList"; // AppEntryをインポート
import NewApp from "./components/NewApp";
import UrlInputDialog from "./components/UrlInputDialog";
import AppEditForm from "./components/AppEditForm";
import { getAppInfoFromUrl, AppInfo, saveAppInfo } from "@/src-tauri/invoke";
import Image from "next/image";
export default function Home() {
  const [isUrlInputDialogOpen, setIsUrlInputDialogOpen] = useState(false);
  const [appInfoToEdit, setAppInfoToEdit] = useState<AppInfo | null>(null);
  const [appChangeTrigger, setAppChangeTrigger] = useState(0); // アプリケーションリスト更新トリガー

  useEffect(() => {
    const handleOpenDialog = () => setIsUrlInputDialogOpen(true);
    document.addEventListener("open-url-input-dialog", handleOpenDialog);
    return () => {
      document.removeEventListener("open-url-input-dialog", handleOpenDialog);
    };
  }, []);

  const handleUrlSubmit = async (url: string) => {
    console.log("URL Submitted:", url);
    try {
      const appInfo = await getAppInfoFromUrl(url);
      console.log("App Info received:", appInfo);
      setAppInfoToEdit(appInfo);
      setIsUrlInputDialogOpen(false);
    } catch (error) {
      console.error("Failed to get app info:", error);
      alert(`Failed to get app info: ${error}`);
    }
  };

  const handleAppAdd = async (appInfo: AppInfo) => {
    // 非同期関数に変更
    console.log("App added:", appInfo);
    try {
      await saveAppInfo(appInfo); // アプリケーションを永続化
      console.log("App saved successfully!");
      setAppInfoToEdit(null); // 編集フォームを閉じる
      setAppChangeTrigger((prev) => prev + 1); // AppListを更新するためにトリガーを増加
    } catch (error) {
      console.error("Failed to save app:", error);
      alert(`Failed to save app: ${error}`);
    }
  };

  const handleAppEditCancel = () => {
    setAppInfoToEdit(null); // 編集フォームを閉じる
  };

  const handleAppEdit = (appEntry: AppEntry) => {
    // AppEntryをAppInfoに変換してAppEditFormに渡す
    const appInfo: AppInfo = {
      id: appEntry.id,
      name: (appEntry.data.name ||
        appEntry.data.title ||
        appEntry.id) as string,
      url: appEntry.data.url as string,
      icon: (appEntry.data.icon || null) as string | null,
      description: (appEntry.data.description || null) as string | null,
    };
    setAppInfoToEdit(appInfo);
  };

  return (
    <main className="flex logo-bg min-h-screen flex-col items-center justify-between p-24">
      <div className="responsive-title">
        <h1>Web Launcher</h1>
      </div>
      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left mx-auto">
        <AppList refreshTrigger={appChangeTrigger} onEdit={handleAppEdit} />{" "}
        {/* トリガーとonEditを渡す */}
        <NewApp />
      </div>

      <UrlInputDialog
        isOpen={isUrlInputDialogOpen}
        onClose={() => setIsUrlInputDialogOpen(false)}
        onSubmit={handleUrlSubmit}
      />
      {appInfoToEdit && ( // appInfoToEditがある場合にAppEditFormをレンダリング
        <AppEditForm
          appInfo={appInfoToEdit}
          onAdd={handleAppAdd}
          onCancel={handleAppEditCancel}
        />
      )}
    </main>
  );
}
