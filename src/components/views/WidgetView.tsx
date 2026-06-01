"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatKoreanDate, getLocalDateString } from "@/lib/date";
import type { WidgetSnapshot } from "@/lib/widget/types";

const REFRESH_MS = 5 * 60 * 1000;

export function WidgetView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [snapshot, setSnapshot] = useState<WidgetSnapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setError("위젯 키가 없습니다. 앱 → 더보기 → 홈 화면 위젯에서 키를 발급하세요.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/widget/today?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "일정을 불러오지 못했습니다.");
      }
      const data = (await res.json()) as WidgetSnapshot;
      setSnapshot(data);
      setError("");
    } catch (err) {
      setSnapshot(null);
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const today = getLocalDateString();
  const dateLabel = snapshot?.date
    ? formatKoreanDate(snapshot.date)
    : formatKoreanDate(today);

  return (
    <div className="widget-shell">
      <header className="widget-header">
        <div className="widget-brand">
          <span className="widget-brand-mark">DA</span>
          <div>
            <strong>Day Anchor</strong>
            <span>{dateLabel}</span>
          </div>
        </div>
        {snapshot ? (
          <span className="widget-completion">{snapshot.completion}%</span>
        ) : null}
      </header>

      {loading ? <p className="widget-muted">불러오는 중…</p> : null}
      {!loading && error ? (
        <div className="widget-error">
          <p>{error}</p>
          <Link href="/app" className="primary-btn small">
            앱 열기
          </Link>
        </div>
      ) : null}

      {!loading && snapshot && !error ? (
        <div className="widget-body">
          {snapshot.current ? (
            <section className="widget-now">
              <span className="tag tag-current">지금</span>
              <strong>{snapshot.current.title}</strong>
              <span>
                {snapshot.current.start}–{snapshot.current.end}
              </span>
            </section>
          ) : null}

          <section className="widget-section">
            <h2>일정</h2>
            {snapshot.blocks.length ? (
              <ul className="widget-list">
                {snapshot.blocks.slice(0, 6).map((block) => (
                  <li key={block.id}>
                    <span className="widget-time">
                      {block.start}–{block.end}
                    </span>
                    <span className="widget-line-title">{block.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="widget-muted">일정 없음</p>
            )}
          </section>

          <section className="widget-section">
            <h2>할 일</h2>
            {snapshot.tasks.length ? (
              <ul className="widget-list widget-task-list">
                {snapshot.tasks.slice(0, 5).map((task) => (
                  <li key={task.id}>{task.title}</li>
                ))}
              </ul>
            ) : (
              <p className="widget-muted">남은 할 일 없음</p>
            )}
          </section>

          <Link
            href={`/app?view=day&date=${snapshot.date}`}
            className="widget-open-app"
          >
            앱에서 열기
          </Link>
        </div>
      ) : null}
    </div>
  );
}
