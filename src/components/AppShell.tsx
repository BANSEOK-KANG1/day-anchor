"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { NAV_VIEWS, VIEW_LABEL } from "@/lib/types";
import { CalendarView } from "@/components/views/CalendarView";
import { ScheduleView } from "@/components/views/ScheduleView";
import { TasksView } from "@/components/views/TasksView";
import { NotesView } from "@/components/views/NotesView";
import { ReviewView } from "@/components/views/ReviewView";
import { InsightsView } from "@/components/views/InsightsView";
import { InstallPrompt } from "@/components/InstallPrompt";

export function AppShell() {
  const router = useRouter();
  const {
    user,
    loading,
    activeView,
    setActiveView,
    activeDate,
    setActiveDate,
    shiftDay,
    toast,
    signOut,
    supabaseReady,
  } = useApp();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(supabaseReady ? "/login" : "/signup");
    }
  }, [loading, user, router, supabaseReady]);

  if (loading) {
    return (
      <div className="landing-shell">
        <p className="eyebrow">Loading</p>
        <h1>Day Anchor 불러오는 중...</h1>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="앱 내비게이션">
        <div className="brand">
          <div className="brand-mark">DA</div>
          <div>
            <strong>Day Anchor</strong>
            <span>달력형 하루 운영 앱</span>
          </div>
        </div>

        <nav className="nav-list">
          {NAV_VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              className={`nav-link ${activeView === view ? "active" : ""}`}
              onClick={() => setActiveView(view)}
            >
              {VIEW_LABEL[view]}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <span className="eyebrow">Synced</span>
          <p>Supabase로 폰과 컴퓨터 데이터가 동기화됩니다. PWA로 홈화면에 추가해 앱처럼 사용하세요.</p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/settings/import" className="ghost-btn small">
              가져오기
            </Link>
            <button type="button" className="ghost-btn small" onClick={() => signOut()}>
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar compact-topbar">
          <div>
            <p className="eyebrow">Calendar-first daily planner</p>
            <h1>달력 중심으로 하루를 운영하세요.</h1>
          </div>
          <div className="topbar-actions">
            <button className="ghost-btn" type="button" onClick={() => shiftDay(-1)}>
              ‹ 전날
            </button>
            <input
              id="activeDate"
              className="date-input"
              type="date"
              aria-label="날짜 선택"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
            />
            <button className="ghost-btn" type="button" onClick={() => shiftDay(1)}>
              다음날 ›
            </button>
            <InstallPrompt />
          </div>
        </header>

        <section className={`view ${activeView === "today" ? "active" : ""}`}>
          <CalendarView />
        </section>
        <section className={`view ${activeView === "schedule" ? "active" : ""}`}>
          <ScheduleView />
        </section>
        <section className={`view ${activeView === "tasks" ? "active" : ""}`}>
          <TasksView />
        </section>
        <section className={`view ${activeView === "notes" ? "active" : ""}`}>
          <NotesView />
        </section>
        <section className={`view ${activeView === "review" ? "active" : ""}`}>
          <ReviewView />
        </section>
        <section className={`view ${activeView === "insights" ? "active" : ""}`}>
          <InsightsView />
        </section>
      </main>

      <div className={`toast ${toast.visible ? "show" : ""}`} role="status" aria-live="polite">
        {toast.message}
      </div>
    </div>
  );
}
