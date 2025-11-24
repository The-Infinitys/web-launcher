"use client";

import Image from "next/image";

export default function NewApp() {
  return (
    <button
      name="new-app"
      type="button"
      aria-label="New App"
      className="p-1 rounded"
    >
      <Image src="/new.svg" width={32} height={32} alt="New App" />
      <span className="sr-only">New App</span>
    </button>
  );
}
