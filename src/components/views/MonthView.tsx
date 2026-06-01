"use client";

import {
  formatKoreanDate,
  formatKoreanMonth,
  formatTimeFromDb,
  getLocalDateString,
} from "@/lib/date";
import { calculateStats } from "@/lib/stats";
import { useApp } from "@/contexts/AppContext";

export function MonthView() {
  const {
    activeDate,
    calendarCursor,
    setActiveDate,
    setActiveView,
    shiftMonthView,
    goToday,
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
        onClick={() => {
          void setActiveDate(dateString).then(() => setActiveView("day"));
        }}
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
    <section className="panel calendar-panel month-only-panel" aria-label="월간 달력">
      <div className="calendar-toolbar">
        <div>
          <p className="eyebrow">Month</p>
          <h2>{formatKoreanMonth(calendarCursor)}</h2>
          <p className="calendar-subtitle">날짜를 누르면 오늘 보드로 이동합니다.</p>
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
  );
}
