  "use client";

import AppList from "./components/AppList";

export default function Home() {
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
          <AppList />
        </div>
      </main>
    </div>
  );
}
