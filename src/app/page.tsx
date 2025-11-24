"use client";

import { useState, useEffect } from "react";
import AppList from "./components/AppList";
import NewApp from "./components/NewApp";
import UrlInputDialog from "./components/UrlInputDialog";
import AppEditForm from "./components/AppEditForm"; // 追加
import { getAppInfoFromUrl, AppInfo } from "@/src-tauri/invoke";
import Image from "next/image";
export default function Home() {
  const [isUrlInputDialogOpen, setIsUrlInputDialogOpen] = useState(false);
  const [appInfoToEdit, setAppInfoToEdit] = useState<AppInfo | null>(null);

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

  const handleAppAdd = (appInfo: AppInfo) => {
    console.log("App added:", appInfo);
    // TODO: アプリをリストに追加するロジック（永続化など）
    setAppInfoToEdit(null); // 編集フォームを閉じる
  };

  const handleAppEditCancel = () => {
    setAppInfoToEdit(null); // 編集フォームを閉じる
  };

  return (
    <main className="flex logo-bg min-h-screen flex-col items-center justify-between p-24">
      <div className="responsive-title">
        <h1>Web Launcher</h1>
        <Image
          className="responsive-icon"
          src="/icon.svg"
          width={64}
          height={64}
          alt="Logo"
        />
      </div>
      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
        <AppList />
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
