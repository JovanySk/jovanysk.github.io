"use client";

import dynamic from "next/dynamic";

// The whole OS (windows, dock, terminal, BM25 index) ships as a lazy chunk only for /os.
const OsApp = dynamic(() => import("./os-app"), { ssr: false });

export function OsEntry() {
  return <OsApp />;
}
