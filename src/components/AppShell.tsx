"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { NAV_VIEWS, VIEW_LABEL, type MoreSubView, type ViewName } from "@/lib/types";
import {
  formatCompactKoreanDate,
  formatCompactKoreanMonth,
  formatKoreanMonth,
  formatShortKoreanDate,
} from "@/lib/date";
import { DayBoardView } from "@/components/views/DayBoardView";
import { MonthView } from "@/components/views/MonthView";
import { MoreView } from "@/components/views/MoreView";
import { QuickDock } from "@/components/QuickDock";
import { QuickCaptureSheet } from "@/components/QuickCaptureSheet";
import { InstallPrompt } from "@/components/InstallPrompt";

const VALID_VIEWS: ViewName[] = ["day", "month", "more"];
const VALID_MORE: MoreSubView[] = ["menu", "review", "insights", "schedule", "tasks", "notes"];

function desktopTitle(view: ViewName, activeDate: string, calendarCursor: string): string {
  if (view === "day") return formatShortKoreanDate(activeDate);
  if (view === "month") return formatKoreanMonth(calendarCursor);
  return "더보기";
}

function mobileHeaderLine(view: ViewName, activeDate: string, calendarCursor: string): string {
  if (view === "day") return `오늘 ${formatCompactKoreanDate(activeDate)}`;
  if (view === "month") return `달력 ${formatCompactKoreanMonth(calendarCursor)}`;
  return "더보기";
}

function buildAppUrl(view: ViewName, date: string, moreSubView: MoreSubView): string {
  const params = new URLSearchParams();
  params.set("view", view);
  params.set("date", date);
  if (view === "more" && moreSubView !== "menu") {
    params.set("more", moreSubView);
  }
  return `/app?${params.toString()}`;
}

function readUrlState(search: string) {
  const params = new URLSearchParams(search);
  const dateParam = params.get("date");
  const viewParam = params.get("view");
  const moreParam = params.get("more");
  return {
    date: dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null,
    view: viewParam && VALID_VIEWS.includes(viewParam as ViewName) ? (viewParam as ViewName) : null,
    more:
      moreParam && VALID_MORE.includes(moreParam as MoreSubView) ? (moreParam as MoreSubView) : null,
  };
}

export function AppShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSynced = useRef(false);
  const applyingHistory = useRef(false);
  const prevNav = useRef<{ view: ViewName; more: MoreSubView; date: string } | null>(null);

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

  const applyUrlState = useCallback(
    (search: string) => {
      const { date, view, more } = readUrlState(search);
      if (date) void setActiveDate(date);
      if (view) setActiveView(view, { keepMoreSub: true });
      if (more && more !== "menu") setMoreSubView(more);
      else if (view === "more") setMoreSubView("menu");
    },
    [setActiveDate, setActiveView, setMoreSubView],
  );

  useEffect(() => {
    if (urlSynced.current || loading || !user) return;

    const parsed = readUrlState(searchParams.toString());
    if (parsed.date) void setActiveDate(parsed.date);
    if (parsed.view) setActiveView(parsed.view, { keepMoreSub: true });
    if (parsed.more && parsed.more !== "menu") setMoreSubView(parsed.more);
    else if (parsed.view === "more") setMoreSubView("menu");

    const view = parsed.view || "day";
    const date = parsed.date || activeDate;
    const more = parsed.more && parsed.more !== "menu" ? parsed.more : "menu";

    urlSynced.current = true;
    prevNav.current = { view, more, date };
    router.replace(buildAppUrl(view, date, more), { scroll: false });
  }, [loading, user, searchParams, setActiveDate, setActiveView, setMoreSubView, router, activeDate]);

  useEffect(() => {
    if (!urlSynced.current || loading || !user || applyingHistory.current) return;

    const prev = prevNav.current;
    const next = { view: activeView, more: moreSubView, date: activeDate };
    const url = buildAppUrl(activeView, activeDate, moreSubView);

    if (!prev) {
      prevNav.current = next;
      return;
    }

    const navChanged = prev.view !== next.view || prev.more !== next.more;
    const dateChanged = prev.date !== next.date;

    if (navChanged) {
      router.push(url, { scroll: false });
    } else if (dateChanged) {
      router.replace(url, { scroll: false });
    }

    prevNav.current = next;
  }, [activeView, activeDate, moreSubView, loading, user, router]);

  useEffect(() => {
    if (!user) return;

    const onPopState = () => {
      applyingHistory.current = true;
      applyUrlState(window.location.search);
      const { view, more, date } = readUrlState(window.location.search);
      prevNav.current = {
        view: view || "day",
        more: more || "menu",
        date: date || activeDate,
      };
      applyingHistory.current = false;
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [user, activeDate, applyUrlState]);

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
  const mobileLine = mobileHeaderLine(activeView, activeDate, calendarCursor);

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
          <div className="mobile-header-bar">
            <button
              className="ghost-btn icon-btn"
              type="button"
              aria-label="전날"
              onClick={() => shiftDay(-1)}
            >
              ‹
            </button>
            <label className="mobile-date-hit">
              <span className="mobile-header-line">{mobileLine}</span>
              <input
                className="mobile-date-input"
                type="date"
                aria-label="날짜 선택"
                value={activeDate}
                onChange={(e) => setActiveDate(e.target.value)}
              />
            </label>
            <button
              className="ghost-btn icon-btn"
              type="button"
              aria-label="다음날"
              onClick={() => shiftDay(1)}
            >
              ›
            </button>
          </div>

          <div className="desktop-topbar">
            <div className="topbar-title-block">
              <p className="eyebrow">{viewLabel}</p>
              <h1>{desktopTitle(activeView, activeDate, calendarCursor)}</h1>
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
