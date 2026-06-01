"use client";

import { useCallback, useEffect, useState } from "react";
import { formatWidgetError } from "@/lib/widget/errors";

const CHECKLIST_KEY = "day-anchor-widget-checklist";

type IssuedWidget = {
  token: string;
  widgetUrl: string;
  apiUrl: string;
};

type Checklist = {
  sqlDone: boolean;
  homeDone: boolean;
};

function loadChecklist(): Checklist {
  if (typeof window === "undefined") return { sqlDone: false, homeDone: false };
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (!raw) return { sqlDone: false, homeDone: false };
    return JSON.parse(raw) as Checklist;
  } catch {
    return { sqlDone: false, homeDone: false };
  }
}

function saveChecklist(next: Checklist) {
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
}

export function WidgetSettingsView() {
  const [issued, setIssued] = useState<IssuedWidget | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checklist, setChecklist] = useState<Checklist>({ sqlDone: false, homeDone: false });
  const [sqlOpen, setSqlOpen] = useState(true);
  const [iosOpen, setIosOpen] = useState(false);
  const [androidOpen, setAndroidOpen] = useState(false);

  useEffect(() => {
    setChecklist(loadChecklist());
  }, []);

  const setCheck = useCallback((patch: Partial<Checklist>) => {
    setChecklist((prev) => {
      const next = { ...prev, ...patch };
      saveChecklist(next);
      return next;
    });
  }, []);

  async function copySqlMigration() {
    try {
      const res = await fetch("/widget-migration.sql");
      if (!res.ok) throw new Error("SQL 파일을 불러오지 못했습니다.");
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setMessage("SQL이 클립보드에 복사됐습니다. Supabase SQL Editor에 붙여넣고 Run 하세요.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "SQL 복사 실패");
    }
  }

  async function verifyWidgetApi(apiUrl: string) {
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "위젯 API 연결 실패");
    }
  }

  async function issueToken() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/widget/token", { method: "POST" });
      const body = (await res.json()) as IssuedWidget & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "발급 실패");
      setIssued(body);
      await verifyWidgetApi(body.apiUrl);
      setMessage("위젯 키가 발급됐고 연결 테스트에 성공했습니다. URL을 저장한 뒤 홈 화면에 추가하세요.");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "발급 실패";
      setError(formatWidgetError(raw));
    } finally {
      setLoading(false);
    }
  }

  async function revokeToken() {
    if (!confirm("위젯 키를 삭제할까요? 연결된 홈 화면 위젯은 더 이상 일정을 불러오지 못합니다.")) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/widget/token", { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "삭제 실패");
      }
      setIssued(null);
      setMessage("위젯 키가 삭제됐습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("클립보드에 복사했습니다.");
    } catch {
      setError("복사에 실패했습니다. 직접 선택해 복사해주세요.");
    }
  }

  const keyIssued = Boolean(issued);

  return (
    <div className="widget-settings">
      <section className="panel">
        <p className="eyebrow">Widget</p>
        <h2>홈 화면 위젯 설정</h2>
        <p className="widget-settings-lead">
          처음이시면 아래 순서대로 진행하세요. 자세한 설명은 프로젝트{" "}
          <code>docs/WIDGET_SETUP_KO.md</code> 가이드를 참고할 수 있습니다.
        </p>

        <ul className="widget-checklist">
          <li className={checklist.sqlDone ? "done" : ""}>
            <label>
              <input
                type="checkbox"
                checked={checklist.sqlDone}
                onChange={(e) => setCheck({ sqlDone: e.target.checked })}
              />
              <span>1. Supabase SQL 실행 완료</span>
            </label>
          </li>
          <li className={keyIssued ? "done" : ""}>
            <span className="widget-check-static">2. 위젯 키 발급 {keyIssued ? "✓" : ""}</span>
          </li>
          <li className={checklist.homeDone ? "done" : ""}>
            <label>
              <input
                type="checkbox"
                checked={checklist.homeDone}
                onChange={(e) => setCheck({ homeDone: e.target.checked })}
              />
              <span>3. 홈 화면에 위젯 URL 추가 완료</span>
            </label>
          </li>
        </ul>
      </section>

      <section className="panel widget-step-panel">
        <button
          type="button"
          className="widget-step-trigger"
          aria-expanded={sqlOpen}
          onClick={() => setSqlOpen((o) => !o)}
        >
          <strong>1단계: Supabase SQL</strong>
          <span>{sqlOpen ? "▾" : "▸"}</span>
        </button>
        {sqlOpen ? (
          <div className="widget-step-body">
            <ol className="widget-steps">
              <li>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
                  Supabase 대시보드
                </a>
                → 프로젝트 선택
              </li>
              <li>
                <strong>SQL Editor</strong> → New query
              </li>
              <li>아래 <strong>SQL 복사</strong> → 붙여넣기 → <strong>Run</strong></li>
              <li>
                <strong>Table Editor</strong>에 <code>widget_tokens</code> 테이블이 보이면 성공
              </li>
            </ol>
            <div className="button-row">
              <button type="button" className="secondary-btn" onClick={() => void copySqlMigration()}>
                SQL 복사
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setCheck({ sqlDone: true })}
              >
                SQL 완료로 표시
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel widget-step-panel">
        <p className="eyebrow">Step 2</p>
        <h3 className="section-title">위젯 키 발급</h3>
        <p className="widget-settings-lead">
          로그인된 계정으로만 발급됩니다. 기존 키가 있으면 새로 발급할 때 교체됩니다.
        </p>
        <div className="button-row">
          <button
            type="button"
            className="primary-btn"
            disabled={loading}
            onClick={() => void issueToken()}
          >
            {loading ? "처리 중…" : "위젯 키 발급"}
          </button>
          <button
            type="button"
            className="ghost-btn"
            disabled={loading}
            onClick={() => void revokeToken()}
          >
            키 삭제
          </button>
        </div>

        {error ? <p className="widget-settings-error">{error}</p> : null}
        {message ? <p className="widget-settings-msg">{message}</p> : null}

        {issued ? (
          <div className="widget-issued-box">
            <label>
              위젯 화면 URL (홈 화면에 이 주소 추가)
              <input readOnly value={issued.widgetUrl} onFocus={(e) => e.target.select()} />
            </label>
            <button
              type="button"
              className="secondary-btn small"
              onClick={() => void copyText(issued.widgetUrl)}
            >
              URL 복사
            </button>
            <label>
              API (Android 네이티브 위젯용, 선택)
              <input readOnly value={issued.apiUrl} onFocus={(e) => e.target.select()} />
            </label>
            <button type="button" className="ghost-btn small" onClick={() => void copyText(issued.apiUrl)}>
              API URL 복사
            </button>
            <p className="widget-settings-hint">
              URL을 메모해 두세요. 키를 잃어버리면 「위젯 키 발급」으로 다시 만들 수 있습니다.
            </p>
            <a href={issued.widgetUrl} className="primary-btn small" target="_blank" rel="noreferrer">
              위젯 미리보기
            </a>
          </div>
        ) : null}
      </section>

      <section className="panel widget-step-panel">
        <button
          type="button"
          className="widget-step-trigger"
          aria-expanded={iosOpen}
          onClick={() => setIosOpen((o) => !o)}
        >
          <strong>3단계: iPhone</strong>
          <span>{iosOpen ? "▾" : "▸"}</span>
        </button>
        {iosOpen ? (
          <div className="widget-step-body">
            <ol className="widget-steps">
              <li>Safari → day-anchor.vercel.app 로그인 → <strong>홈 화면에 추가</strong></li>
              <li>
                <strong>단축어</strong> 앱 → 「URL 열기」→ 위젯 URL 붙여넣기 → 홈 화면에 추가
              </li>
              <li>또는 Safari 북마크로 위젯 URL 저장</li>
            </ol>
            <button type="button" className="ghost-btn small" onClick={() => setCheck({ homeDone: true })}>
              iPhone 설정 완료
            </button>
          </div>
        ) : null}
      </section>

      <section className="panel widget-step-panel">
        <button
          type="button"
          className="widget-step-trigger"
          aria-expanded={androidOpen}
          onClick={() => setAndroidOpen((o) => !o)}
        >
          <strong>3단계: Android</strong>
          <span>{androidOpen ? "▾" : "▸"}</span>
        </button>
        {androidOpen ? (
          <div className="widget-step-body">
            <ol className="widget-steps">
              <li>Chrome → <strong>앱 설치</strong> / 홈 화면에 추가</li>
              <li>아이콘 <strong>길게 누르기</strong> → 오늘 일정 / +일정 / 위젯 설정</li>
              <li>Chrome에서 위젯 URL 열기 → ⋮ → <strong>홈 화면에 추가</strong></li>
            </ol>
            <button type="button" className="ghost-btn small" onClick={() => setCheck({ homeDone: true })}>
              Android 설정 완료
            </button>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h3 className="section-title">바로가기 (PWA)</h3>
        <p className="widget-settings-lead">
          Android: Day Anchor 아이콘 <strong>길게 누르기</strong> → 오늘 일정, +일정, +할일, 위젯 설정.
          iOS는 제한적일 수 있습니다.
        </p>
      </section>
    </div>
  );
}
