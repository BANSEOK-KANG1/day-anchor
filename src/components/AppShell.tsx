"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { NAV_VIEWS, VIEW_LABEL, type MoreSubView, type ViewName } from "@/lib/types";
import { formatShortKoreanDate, formatKoreanMonth } from "@/lib/date";
import { DayBoardView } from "@/components/views/DayBoardView";
import { MonthView } from "@/components/views/MonthView";
import { MoreView } from "@/components/views/MoreView";
import { QuickDock } from "@/components/QuickDock";
import { QuickCaptureSheet } from "@/components/QuickCaptureSheet";
import { InstallPrompt } from "@/components/InstallPrompt";

const VALID_VIEWS: ViewName[] = ["day", "month", "more"];
const VALID_MORE: MoreSubView[] = ["menu", "review", "insights", "schedule", "tasks", "notes"];

function topbarTitle(view: ViewName, activeDate: string, calendarCursor: string): string {
  if (view === "day") return formatShortKoreanDate(activeDate);
  if (view === "month") return formatKoreanMonth(calendarCursor);
  return "더보기";
}

export function AppShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSynced = useRef(false);

  const {
    user,
    loading,
    activeView,
    moreSubView,
    setActiveView,
    setMoreSubView,
    activeDate,
    calendarCursor,
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

  useEffect(() => {
    if (urlSynced.current || loading || !user) return;
    const dateParam = searchParams.get("date");
    const viewParam = searchParams.get("view");
    const moreParam = searchParams.get("more");

    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      void setActiveDate(dateParam);
    }
    if (viewParam && VALID_VIEWS.includes(viewParam as ViewName)) {
      setActiveView(viewParam as ViewName, { keepMoreSub: true });
    }
    if (moreParam && VALID_MORE.includes(moreParam as MoreSubView) && moreParam !== "menu") {
      setMoreSubView(moreParam as MoreSubView);
    }
    urlSynced.current = true;
  }, [loading, user, searchParams, setActiveDate, setActiveView, setMoreSubView]);

  useEffect(() => {
    if (!urlSynced.current || loading || !user) return;
    const params = new URLSearchParams();
    params.set("view", activeView);
    params.set("date", activeDate);
    if (activeView === "more" && moreSubView !== "menu") {
      params.set("more", moreSubView);
    }
    router.replace(`/app?${params.toString()}`, { scroll: false });
  }, [activeView, activeDate, moreSubView, loading, user, router]);

  if (loading) {
    return (
      <div className="landing-shell">
        <p className="eyebrow">Loading</p>
        <h1>Day Anchor 불러오는 중...</h1>
      </div>
    );
  }

  if (!user) return null;

  const viewLabel = VIEW_LABEL[activeView];
  const title = topbarTitle(activeView, activeDate, calendarCursor);

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
          <p>Supabase로 폰과 컴퓨터 데이터가 동기화됩니다.</p>
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
        <header className="topbar slim-topbar">
          <div className="topbar-title-block">
            <p className="eyebrow">{viewLabel}</p>
            <h1>{title}</h1>
          </div>
          <div className="topbar-actions">
            <button className="ghost-btn icon-btn" type="button" aria-label="전날" onClick={() => shiftDay(-1)}>
              ‹
            </button>
            <input
              id="activeDate"
              className="date-input"
              type="date"
              aria-label="날짜 선택"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
            />
            <button className="ghost-btn icon-btn" type="button" aria-label="다음날" onClick={() => shiftDay(1)}>
              ›
            </button>
            <InstallPrompt />
          </div>
        </header>

        <section className={`view ${activeView === "day" ? "active" : ""}`}>
          <DayBoardView />
        </section>
        <section className={`view ${activeView === "month" ? "active" : ""}`}>
          <MonthView />
        </section>
        <section className={`view ${activeView === "more" ? "active" : ""}`}>
          <MoreView />
        </section>
      </main>

      <QuickDock />
      <QuickCaptureSheet />

      <div className={`toast ${toast.visible ? "show" : ""}`} role="status" aria-live="polite">
        {toast.message}
      </div>
    </div>
  );
}
