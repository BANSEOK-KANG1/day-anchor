"use client";

import { useApp } from "@/contexts/AppContext";
import type { QuickCaptureTab } from "@/lib/types";

const DOCK_ITEMS: { tab: QuickCaptureTab; label: string }[] = [
  { tab: "schedule", label: "일정" },
  { tab: "task", label: "할일" },
  { tab: "note", label: "메모" },
];

export function QuickDock() {
  const { activeView, openQuickCapture } = useApp();

  if (activeView !== "day") return null;

  return (
    <div className="mobile-quick-dock" aria-label="빠른 추가">
      {DOCK_ITEMS.map((item) => (
        <button key={item.tab} type="button" onClick={() => openQuickCapture(item.tab)}>
          <span className="dock-plus">+</span>
          <span className="dock-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
