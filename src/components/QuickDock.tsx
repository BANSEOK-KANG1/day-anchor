"use client";

import { useApp } from "@/contexts/AppContext";
import type { QuickCaptureTab } from "@/lib/types";

const DOCK_ITEMS: { tab: QuickCaptureTab; label: string }[] = [
  { tab: "schedule", label: "+ 일정" },
  { tab: "task", label: "+ 할 일" },
  { tab: "note", label: "+ 메모" },
];

export function QuickDock() {
  const { activeView, openQuickCapture } = useApp();

  if (activeView !== "day") return null;

  return (
    <div className="mobile-quick-dock" aria-label="모바일 빠른 실행">
      {DOCK_ITEMS.map((item) => (
        <button key={item.tab} type="button" onClick={() => openQuickCapture(item.tab)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
