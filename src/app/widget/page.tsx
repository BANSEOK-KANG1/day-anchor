import { Suspense } from "react";
import { WidgetView } from "@/components/views/WidgetView";

export const metadata = {
  title: "Day Anchor 위젯",
  description: "오늘 일정·할 일 미리보기",
};

function WidgetFallback() {
  return (
    <div className="widget-shell">
      <p className="widget-muted">불러오는 중…</p>
    </div>
  );
}

export default function WidgetPage() {
  return (
    <Suspense fallback={<WidgetFallback />}>
      <WidgetView />
    </Suspense>
  );
}
