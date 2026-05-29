"use client";

import { AppProvider } from "@/contexts/AppContext";
import { AppShell } from "@/components/AppShell";

export default function AppPage() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
