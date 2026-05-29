"use client";

import { useApp, useInsightCards } from "@/contexts/AppContext";

export function InsightsView() {
  const { events } = useApp();
  const insightCards = useInsightCards();

  return (
    <div className="grid two-col">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Behavior data</p>
            <h2>최근 7일 인사이트</h2>
          </div>
        </div>
        <div className="insight-grid">
          {insightCards.map((card) => (
            <div key={card.label} className="insight-card">
              <strong>{card.value}</strong>
              <span>{card.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Event log</p>
            <h2>행동 이벤트 로그</h2>
          </div>
        </div>
        {!events.length ? (
          <div className="empty-state">아직 이벤트 로그가 없습니다.</div>
        ) : (
          <div className="event-log">
            {events.map((event) => (
              <div key={event.id} className="event-line">
                <strong>{event.event_name}</strong> ·{" "}
                {new Date(event.created_at).toLocaleString("ko-KR")}
                <br />
                {JSON.stringify(event.properties)}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
