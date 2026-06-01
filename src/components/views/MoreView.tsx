"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { MORE_SUB_LABEL, type MoreSubView } from "@/lib/types";
import { ReviewView } from "@/components/views/ReviewView";
import { InsightsView } from "@/components/views/InsightsView";
import { ScheduleView } from "@/components/views/ScheduleView";
import { TasksView } from "@/components/views/TasksView";
import { NotesView } from "@/components/views/NotesView";

const MORE_ITEMS: { id: Exclude<MoreSubView, "menu">; desc: string }[] = [
  { id: "review", desc: "하루 회고와 내일 이월" },
  { id: "insights", desc: "최근 7일 흐름 분석" },
  { id: "schedule", desc: "일정 상세 편집" },
  { id: "tasks", desc: "할 일 상세 편집" },
  { id: "notes", desc: "메모·음성 전체 목록" },
];

export function MoreView() {
  const router = useRouter();
  const { moreSubView, setMoreSubView, exportData, signOut } = useApp();

  if (moreSubView !== "menu") {
    return (
      <div className="more-subview">
        <div className="subview-header">
          <button
            type="button"
            className="ghost-btn small back-chip"
            onClick={() => router.back()}
          >
            ← 뒤로
          </button>
          <h2>{MORE_SUB_LABEL[moreSubView]}</h2>
        </div>
        {moreSubView === "review" ? <ReviewView /> : null}
        {moreSubView === "insights" ? <InsightsView /> : null}
        {moreSubView === "schedule" ? <ScheduleView /> : null}
        {moreSubView === "tasks" ? <TasksView /> : null}
        {moreSubView === "notes" ? <NotesView /> : null}
      </div>
    );
  }

  return (
    <div className="more-menu">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">More</p>
            <h2>더보기</h2>
          </div>
        </div>
        <div className="more-list">
          {MORE_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="more-list-item"
              onClick={() => setMoreSubView(item.id)}
            >
              <strong>{MORE_SUB_LABEL[item.id]}</strong>
              <span>{item.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h2>설정</h2>
          </div>
        </div>
        <div className="button-row">
          <Link href="/settings/import" className="ghost-btn">
            데이터 가져오기
          </Link>
          <button type="button" className="ghost-btn" onClick={() => exportData()}>
            JSON 내보내기
          </button>
          <button type="button" className="ghost-btn" onClick={() => signOut()}>
            로그아웃
          </button>
        </div>
      </section>
    </div>
  );
}
