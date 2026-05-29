"use client";

import {
  formatKoreanDate,
  formatKoreanMonth,
  formatTimeFromDb,
  getLocalDateString,
} from "@/lib/date";
import { calculateStats } from "@/lib/stats";
import { useApp } from "@/contexts/AppContext";
import {
  BLOCK_STATUS_LABEL,
  BLOCK_TYPE_LABEL,
  type ScheduleBlock,
} from "@/lib/types";
import { BlockTimeline } from "@/components/shared/BlockTimeline";
import { TaskList } from "@/components/shared/TaskList";

export function CalendarView() {
  const {
    activeDate,
    calendarCursor,
    setActiveDate,
    shiftMonthView,
    goToday,
    day,
    blocks,
    tasks,
    stats,
    currentBlock,
    currentTime,
    setActiveView,
    showToast,
    addReminderPrompt,
    saveDayPlan,
    seedSampleData,
    monthDays,
    monthBlocks,
    monthTasks,
    monthNotes,
  } = useApp();

  const todayString = getLocalDateString();
  const monthKey = calendarCursor.slice(0, 7);
  const cursor = new Date(`${calendarCursor}T00:00:00`);
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    const dateString = getLocalDateString(cellDate);
    const dayRecord = monthDays.find((d) => d.date === dateString) ?? null;
    const dayId = dayRecord?.id;
    const dayBlocks = monthBlocks.filter((b) => b.day_id === dayId);
    const dayTasks = monthTasks.filter((t) => t.day_id === dayId);
    const dayNotes = monthNotes.filter((n) => n.day_id === dayId);
    const dayStats = calculateStats({
      day: dayRecord,
      blocks: dayBlocks,
      tasks: dayTasks,
      notes: dayNotes,
    });
    const inMonth = dateString.startsWith(monthKey);
    const isSelected = dateString === activeDate;
    const isToday = dateString === todayString;
    const hasData = Boolean(
      dayRecord?.main_goal || dayBlocks.length || dayTasks.length || dayNotes.length,
    );
    const firstBlock = dayBlocks[0];
    const doneTasks = dayTasks.filter((task) => task.status === "done").length;

    cells.push(
      <button
        key={dateString}
        className={`calendar-day ${inMonth ? "" : "outside-month"} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""} ${hasData ? "has-data" : ""}`}
        type="button"
        onClick={() => setActiveDate(dateString)}
        aria-label={`${formatKoreanDate(dateString)} 선택`}
      >
        <span className="day-topline">
          <strong>{cellDate.getDate()}</strong>
          {isToday ? <em>오늘</em> : null}
        </span>
        <span className="day-metrics">
          <span>일정 {dayBlocks.length}</span>
          <span>
            할 일 {doneTasks}/{dayTasks.length}
          </span>
          <span>메모 {dayNotes.length}</span>
        </span>
        <span className="calendar-events">
          {firstBlock ? (
            <span className="calendar-event">
              <b>{formatTimeFromDb(firstBlock.start_time)}</b> {firstBlock.title}
            </span>
          ) : hasData ? (
            <span className="calendar-event muted-event">기록 있음</span>
          ) : (
            <span className="calendar-empty">비어 있음</span>
          )}
          {dayBlocks.length > 1 ? (
            <span className="calendar-more">+{dayBlocks.length - 1}</span>
          ) : null}
        </span>
        <span className="day-score">{dayStats.completion}%</span>
      </button>,
    );
  }

  return (
    <>
      <div className="calendar-layout">
        <section className="panel calendar-panel" aria-label="월간 달력">
          <div className="calendar-toolbar">
            <div>
              <p className="eyebrow">Main calendar</p>
              <h2>{formatKoreanMonth(calendarCursor)}</h2>
              <p className="calendar-subtitle">
                날짜를 누르면 해당 날짜의 일정·체크리스트·메모가 바로 아래 보드에 연결됩니다.
              </p>
            </div>
            <div className="calendar-controls">
              <button className="ghost-btn" type="button" aria-label="이전 달" onClick={() => shiftMonthView(-1)}>
                ‹
              </button>
              <button className="secondary-btn" type="button" onClick={() => goToday()}>
                오늘
              </button>
              <button className="ghost-btn" type="button" aria-label="다음 달" onClick={() => shiftMonthView(1)}>
                ›
              </button>
            </div>
          </div>

          <div className="weekday-row" aria-hidden="true">
            {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="month-calendar">{cells}</div>
        </section>

        <aside className="panel day-dock" aria-label="선택한 날짜 요약">
          <div className="selected-day-head">
            <p className="eyebrow">{formatKoreanDate(activeDate)}</p>
            <h2>
              {day?.main_goal
                ? day.main_goal.split("\n")[0]
                : "아직 선택한 날짜 보드가 비어 있어요."}
            </h2>
            <p>
              {day?.focus_window
                ? `중요 시간대: ${day.focus_window}${day.avoid_text ? ` · 피할 것: ${day.avoid_text}` : ""}`
                : "날짜를 고른 뒤 일정, 체크리스트, 메모를 붙여보세요."}
            </p>
          </div>

          <div className="hero-stats compact-stats" aria-label="선택 날짜 요약 지표">
            <div>
              <strong>{stats.completion}%</strong>
              <span>완료율</span>
            </div>
            <div>
              <strong>{stats.blockCount}</strong>
              <span>일정</span>
            </div>
            <div>
              <strong>{stats.memoCount}</strong>
              <span>메모</span>
            </div>
            <div>
              <strong>{stats.voiceCount}</strong>
              <span>음성</span>
            </div>
          </div>

          <div className="now-card">
            <div className="panel-header tight">
              <div>
                <p className="eyebrow">Now</p>
                <h3>지금 할 일</h3>
              </div>
              <span className="pill">{currentTime}</span>
            </div>
            {currentBlock ? (
              <CurrentMiniCard block={currentBlock} />
            ) : (
              <div className="empty-state">
                현재 시간에 연결된 일정이 없습니다. 달력에서 날짜를 고른 뒤 일정 블록을 추가해보세요.
              </div>
            )}
          </div>

          <div className="quick-actions mobile-friendly-actions">
            <button className="secondary-btn" type="button" onClick={() => setActiveView("notes")}>
              메모
            </button>
            <button className="secondary-btn" type="button" onClick={() => setActiveView("tasks")}>
              할 일
            </button>
            <button
              className="secondary-btn"
              type="button"
              onClick={() => {
                const time = prompt("메모 알림 시간을 입력하세요. 예: 15:30");
                if (!time || !/^\d{2}:\d{2}$/.test(time)) {
                  showToast("시간 형식은 15:30처럼 입력해주세요.");
                  return;
                }
                const message = prompt(
                  "알림에 표시할 메모 질문을 입력하세요.",
                  "지금 하고 있는 일과 다음 행동을 기록하세요.",
                );
                if (message) addReminderPrompt(time, message);
              }}
            >
              알림
            </button>
            <button className="primary-btn" type="button" onClick={() => setActiveView("schedule")}>
              일정 추가
            </button>
          </div>
        </aside>
      </div>

      <div className="calendar-bottom-grid">
        <section className="panel agenda-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Agenda</p>
              <h2>선택 날짜 시간표</h2>
            </div>
            <button className="primary-btn small" type="button" onClick={() => setActiveView("schedule")}>
              일정 추가
            </button>
          </div>
          <BlockTimeline blocks={blocks} editable={false} />
        </section>

        <section className="panel checklist-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Checklist</p>
              <h2>선택 날짜 체크리스트</h2>
            </div>
            <button className="primary-btn small" type="button" onClick={() => setActiveView("tasks")}>
              할 일 추가
            </button>
          </div>
          <TaskList tasks={tasks.slice(0, 6)} compact />
        </section>

        <section className="panel plan-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">1-minute plan</p>
              <h2>하루 계획</h2>
            </div>
            <button className="ghost-btn" type="button" onClick={() => seedSampleData()}>
              샘플 채우기
            </button>
          </div>
          <DayPlanForm
            initial={{
              mainGoal: day?.main_goal ?? "",
              avoidThing: day?.avoid_text ?? "",
              focusWindow: day?.focus_window ?? "",
            }}
            onSave={saveDayPlan}
          />
        </section>
      </div>
    </>
  );
}

function CurrentMiniCard({ block }: { block: ScheduleBlock }) {
  return (
    <article className="timeline-item current-mini-card">
      <div className="timeline-time">
        {formatTimeFromDb(block.start_time)}
        <br />~ {formatTimeFromDb(block.end_time)}
      </div>
      <div className="timeline-body">
        <strong>{block.title}</strong>
        <p>{block.memo || "지금 이 블록에 집중해보세요."}</p>
        <div className="meta-row">
          <span className="tag">{BLOCK_TYPE_LABEL[block.block_type]}</span>
          <span className={`tag status-${block.status}`}>
            {BLOCK_STATUS_LABEL[block.status]}
          </span>
        </div>
      </div>
    </article>
  );
}

function DayPlanForm({
  initial,
  onSave,
}: {
  initial: { mainGoal: string; avoidThing: string; focusWindow: string };
  onSave: (payload: { mainGoal: string; avoidThing: string; focusWindow: string }) => Promise<void>;
}) {
  return (
    <form
      className="stack-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        await onSave({
          mainGoal: String(data.get("mainGoal") ?? ""),
          avoidThing: String(data.get("avoidThing") ?? ""),
          focusWindow: String(data.get("focusWindow") ?? ""),
        });
      }}
    >
      <label>
        오늘 꼭 해야 할 핵심 목표
        <textarea
          name="mainGoal"
          rows={3}
          defaultValue={initial.mainGoal}
          placeholder="예: 포트폴리오 케이스 페이지를 가설-실험-결과 구조로 정리하기"
        />
      </label>
      <label>
        오늘 피해야 하는 것
        <input
          name="avoidThing"
          type="text"
          defaultValue={initial.avoidThing}
          placeholder="예: 의미 없는 유튜브/카톡 반복 확인"
        />
      </label>
      <label>
        오늘 가장 중요한 시간대
        <input
          name="focusWindow"
          type="text"
          defaultValue={initial.focusWindow}
          placeholder="예: 10:00~12:00 집중작업"
        />
      </label>
      <button className="primary-btn full" type="submit">
        하루 계획 저장
      </button>
    </form>
  );
}
