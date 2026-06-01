"use client";

import { Suspense } from "react";
import { AppProvider } from "@/contexts/AppContext";
import { AppShell } from "@/components/AppShell";

function AppShellFallback() {
  return (
    <div className="landing-shell">
      <p className="eyebrow">Loading</p>
      <h1>Day Anchor 불러오는 중...</h1>
    </div>
  );
}

export default function AppPage() {
  return (
    <AppProvider>
      <Suspense fallback={<AppShellFallback />}>
        <AppShell />
      </Suspense>
    </AppProvider>
  );
}
