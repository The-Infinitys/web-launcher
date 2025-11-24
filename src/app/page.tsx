"use client";

import { useState, useEffect } from "react";
import AppList, { AppEntry } from "./components/AppList"; // AppEntryをインポート
import NewApp from "./components/NewApp";
import UrlInputDialog from "./components/UrlInputDialog";
import AppEditForm from "./components/AppEditForm";
import LoadingSpinner from "./components/LoadingSpinner"; // LoadingSpinnerをインポート
import {
  getAppInfoFromUrl,
  AppInfo,
  saveAppInfo,
  deleteAppDir,
} from "@/src-tauri/invoke"; // deleteAppDirをインポート
export default function Home() {
  const [isUrlInputDialogOpen, setIsUrlInputDialogOpen] = useState(false);
  const [appInfoToEdit, setAppInfoToEdit] = useState<AppInfo | null>(null);
  const [appChangeTrigger, setAppChangeTrigger] = useState(0); // アプリケーションリスト更新トリガー
  const [isLoading, setIsLoading] = useState(false); // ローディング状態を追加

  useEffect(() => {
    const handleOpenDialog = () => setIsUrlInputDialogOpen(true);
    document.addEventListener("open-url-input-dialog", handleOpenDialog);
    return () => {
      document.removeEventListener("open-url-input-dialog", handleOpenDialog);
    };
  }, []);

  const handleUrlSubmit = async (url: string) => {
    console.log("URL Submitted:", url);
    setIsLoading(true); // ローディング開始
    try {
      // 新規作成時はIDがない状態でAppInfoを取得し、編集フォームで新規であることを示す
      const appInfo = await getAppInfoFromUrl(url);
      console.log("App Info received:", appInfo);
      setAppInfoToEdit(appInfo);
      setIsUrlInputDialogOpen(false);
    } catch (error) {
      console.error("Failed to get app info:", error);
      alert(`Failed to get app info: ${error}`);
    } finally {
      setIsLoading(false); // ローディング終了
    }
  };

  const handleAppAdd = async (appInfo: AppInfo) => {
    // 非同期関数に変更
    console.log("App added:", appInfo);
    setIsLoading(true); // ローディング開始
    try {
      await saveAppInfo(appInfo); // アプリケーションを永続化（新規追加も編集もこれで対応）
      console.log("App saved successfully!");
      setAppInfoToEdit(null); // 編集フォームを閉じる
      setAppChangeTrigger((prev) => prev + 1); // AppListを更新するためにトリガーを増加
    } catch (error) {
      console.error("Failed to save app:", error);
      alert(`Failed to save app: ${error}`);
    } finally {
      setIsLoading(false); // ローディング終了
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

  const handleAppDelete = async (appId: string) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      setIsLoading(true); // ローディング開始
      try {
        await deleteAppDir(appId);
        console.log("App deleted successfully!");
        setAppChangeTrigger((prev) => prev + 1); // AppListを更新するためにトリガーを増加
      } catch (error) {
        console.error("Failed to delete app:", error);
        alert(`Failed to delete app: ${error}`);
      } finally {
        setIsLoading(false); // ローディング終了
      }
    }
  };

  return (
    <main className="logo-bg main-layout">
      <h1 className="responsive-title">Web Launcher</h1>
      <div className="app-section">
        {" "}
        <AppList
          refreshTrigger={appChangeTrigger}
          onEdit={handleAppEdit}
          onDelete={handleAppDelete} // onDeleteを渡す
        />
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

      <LoadingSpinner isVisible={isLoading} />
    </main>
  );
}
