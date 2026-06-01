"use client";

import { SCHEDULE_PREVIEW_ITEMS } from "@/lib/samplePreview";

export function ScheduleExamplePreview() {
  return (
    <div className="schedule-example-preview" aria-label="일정 예시 미리보기">
      <p className="schedule-example-lead">
        <span className="tag tag-example">예시</span>
        이렇게 일정을 쌓을 수 있어요. 아래 버튼으로 <strong>내 일정</strong>을 직접 추가하세요.
      </p>
      <div className="day-schedule-stack schedule-example-stack">
        {SCHEDULE_PREVIEW_ITEMS.map((item) => (
          <section key={item.title} className="schedule-group schedule-group-example">
            <article className="schedule-block-row">
              <div className="schedule-block-time-col">
                <span className="schedule-block-time-start">{item.start}</span>
                <span className="schedule-block-time-end">{item.end}</span>
              </div>
              <div className="schedule-block-main">
                <div className="schedule-block-head">
                  <strong className="schedule-block-title">{item.title}</strong>
                </div>
                <p className="schedule-block-memo">{item.memo}</p>
                <div className="meta-row schedule-meta-row">
                  <span className="tag">{item.typeLabel}</span>
                  <span className="tag">예시</span>
                </div>
              </div>
            </article>
          </section>
        ))}
      </div>
    </div>
  );
}
