"use client";

import { initI18n } from "@/i18n/i18n";

export default function Home() {
  const { t } = initI18n("", "en");
  return (
    <div className="logo-bg flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="relative z-10 flex w-full max-w-3xl flex-col items-center py-12 px-16">
        <div
          id="logo"
          className="w-full flex flex-col items-center justify-start mt-8"
        >
          <h1 className="responsive-title">Web Launcher</h1>
        </div>
        <div id="apps" className="w-full mt-8">
          <p>{t("apps_not_found")}</p>
        </div>
      </main>
    </div>
  );
}
