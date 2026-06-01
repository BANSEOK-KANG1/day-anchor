"use client";

import { useState } from "react";

type IssuedWidget = {
  token: string;
  widgetUrl: string;
  apiUrl: string;
};

export function WidgetSettingsView() {
  const [issued, setIssued] = useState<IssuedWidget | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function issueToken() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/widget/token", { method: "POST" });
      const body = (await res.json()) as IssuedWidget & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "발급 실패");
      setIssued(body);
      setMessage("위젯 키가 발급됐습니다. 아래 URL은 한 번만 안전한 곳에 저장하세요.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "발급 실패");
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

  return (
    <div className="widget-settings">
      <section className="panel">
        <p className="eyebrow">Widget</p>
        <h2>홈 화면 위젯</h2>
        <p className="widget-settings-lead">
          PWA만으로는 iOS/Android <strong>시스템 위젯</strong>을 직접 넣을 수 없습니다. 대신
          아래 <strong>위젯 전용 URL</strong>로 오늘 일정을 보여 주고, Android에서는 앱 아이콘
          바로가기·WebView 위젯 앱과 함께 쓸 수 있습니다.
        </p>

        <ol className="widget-steps">
          <li>
            <strong>위젯 키 발급</strong> — 아래 버튼 (기존 키는 교체됩니다)
          </li>
          <li>
            <strong>위젯 URL 복사</strong> — 홈 화면 바로가기 또는 Android 위젯 앱에 등록
          </li>
          <li>
            (선택) Android Studio로 <code>android/</code> 샘플 위젯 빌드 —{" "}
            <code>docs/WIDGET.md</code> 참고
          </li>
        </ol>

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
              위젯 화면 URL
              <input readOnly value={issued.widgetUrl} onFocus={(e) => e.target.select()} />
            </label>
            <button type="button" className="secondary-btn small" onClick={() => void copyText(issued.widgetUrl)}>
              URL 복사
            </button>
            <label>
              API (Android 네이티브 위젯용)
              <input readOnly value={issued.apiUrl} onFocus={(e) => e.target.select()} />
            </label>
            <button type="button" className="ghost-btn small" onClick={() => void copyText(issued.apiUrl)}>
              API URL 복사
            </button>
            <p className="widget-settings-hint">
              키는 다시 표시되지 않습니다. URL을 잃어버리면 새로 발급하세요.
            </p>
            <a href={issued.widgetUrl} className="primary-btn small" target="_blank" rel="noreferrer">
              위젯 미리보기
            </a>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h3 className="section-title">바로가기 (이미 적용됨)</h3>
        <p className="widget-settings-lead">
          Android에서 Day Anchor 아이콘을 <strong>길게 누르면</strong> 「오늘 일정」「+일정」「+할일」
          바로가기가 보입니다. iOS는 제한적일 수 있습니다.
        </p>
      </section>
    </div>
  );
}
