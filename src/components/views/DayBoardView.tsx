"use client";

import { FormEvent, useState } from "react";
import {
  formatTimeFromDb,
  getLocalDateString,
} from "@/lib/date";
import { useApp } from "@/contexts/AppContext";
import { useMobileLayout } from "@/lib/useMobileLayout";
import type { Task } from "@/lib/types";
import { DayScheduleSection } from "@/components/shared/DayScheduleSection";
import { ScheduleExamplePreview } from "@/components/shared/ScheduleExamplePreview";

export function DayBoardView() {
  const {
    activeDate,
    day,
    blocks,
    tasks,
    notes,
    stats,
    currentBlock,
    currentTime,
    saveDayPlan,
    setBlockStatus,
    removeBlock,
    clearDaySchedules,
    clearDayTasks,
    saveTask,
    toggleTask,
    removeTask,
    removeNote,
    addReminderPrompt,
    openQuickCapture,
    setMoreSubView,
    setActiveView,
    showToast,
  } = useApp();

  const mobileLayout = useMobileLayout();
  const todayString = getLocalDateString();
  const isToday = activeDate === todayString;
  const hour = new Date().getHours();
  const showReviewBanner = isToday && !day?.review_completed && hour >= 18;
  const planExpanded = false;
  const [planOpen, setPlanOpen] = useState(planExpanded);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const unlinkedTasks = tasks.filter((task) => !task.schedule_block_id);
  const scheduleEmpty = !blocks.length && !unlinkedTasks.length;

  const taskHandlers = {
    onToggle: toggleTask,
    onTaskDone: async (id: string) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      await saveTask({
        id: task.id,
        title: task.title,
        priority: task.priority,
        blockId: task.schedule_block_id,
        dueTime: task.due_time,
        status: "done",
      });
    },
    onTaskSkip: async (id: string) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      await saveTask({
        id: task.id,
        title: task.title,
        priority: task.priority,
        blockId: task.schedule_block_id,
        dueTime: task.due_time,
        status: "skipped",
        delayReason: "이유 미기록",
      });
    },
    onTaskCarry: async (id: string) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      await saveTask({
        id: task.id,
        title: task.title,
        priority: task.priority,
        blockId: task.schedule_block_id,
        dueTime: task.due_time,
        status: "carried",
        delayReason: "내일 처리 예정",
      });
    },
    onTaskEdit: (_task: Task) => {
      setMoreSubView("tasks");
      setActiveView("more", { keepMoreSub: true });
    },
    onTaskDelete: async (id: string) => {
      if (confirm("이 할 일을 삭제할까요?")) await removeTask(id);
    },
  };

  return (
    <div className="day-board">
      {showReviewBanner ? (
        <div className="review-banner">
          <div>
            <strong>오늘 회고를 마무리하세요</strong>
            <p>한 줄 회고와 미완료 정리를 해두면 내일이 가벼워집니다.</p>
          </div>
          <button
            type="button"
            className="secondary-btn small"
            onClick={() => {
              setMoreSubView("review");
              setActiveView("more", { keepMoreSub: true });
            }}
          >
            회고하기
          </button>
        </div>
      ) : null}

      <section className="panel day-schedule-panel day-hero-panel">
        <div className="day-hero-header">
          <div className="day-hero-top">
            <h2 className="hero-title">오늘 일정</h2>
            <div className="header-chip-row">
              <button className="primary-btn small add-chip" type="button" onClick={() => openQuickCapture("schedule")}>
                + 일정
              </button>
              <button className="secondary-btn small add-chip" type="button" onClick={() => openQuickCapture("task")}>
                + 할일
              </button>
            </div>
          </div>
          {currentBlock && isToday ? (
            <div className="now-focus-bar">
              <span className="tag tag-current">지금</span>
              <span className="now-focus-time">
                {formatTimeFromDb(currentBlock.start_time)}–{formatTimeFromDb(currentBlock.end_time)}
              </span>
              <strong className="now-focus-title">{currentBlock.title}</strong>
            </div>
          ) : null}
        </div>

        <div className="day-schedule-body">
          {scheduleEmpty ? (
            <div className="empty-in-hero">
              <ScheduleExamplePreview />
              <div className="empty-actions">
                <button type="button" className="primary-btn full" onClick={() => openQuickCapture("schedule")}>
                  + 내 일정 추가
                </button>
              </div>
            </div>
          ) : (
            <>
              {blocks.length > 0 || tasks.length > 0 ? (
                <div className="day-schedule-toolbar">
                  {blocks.length > 0 ? (
                    <button
                      type="button"
                      className="link-btn small"
                      onClick={() => void clearDaySchedules()}
                    >
                      오늘 일정 모두 삭제
                    </button>
                  ) : null}
                  {tasks.length > 0 ? (
                    <button
                      type="button"
                      className="link-btn small"
                      onClick={() => void clearDayTasks()}
                    >
                      오늘 할 일 모두 삭제
                    </button>
                  ) : null}
                </div>
              ) : null}
              <DayScheduleSection
                blocks={blocks}
                tasks={tasks}
                currentBlockId={currentBlock?.id}
                isToday={isToday}
                onBlockDone={(id) => setBlockStatus(id, "done")}
                onBlockSkip={(id) => setBlockStatus(id, "skipped")}
                onBlockDelete={async (id) => {
                  if (confirm("이 일정을 삭제할까요?")) await removeBlock(id);
                }}
                onBlockEdit={(_block) => {
                  setMoreSubView("schedule");
                  setActiveView("more", { keepMoreSub: true });
                }}
                {...taskHandlers}
              />
            </>
          )}
        </div>

        {mobileLayout ? (
          <div className="day-hero-footer">
            <button
              type="button"
              className="ghost-btn small day-stats-toggle"
              aria-expanded={statsOpen}
              onClick={() => setStatsOpen((open) => !open)}
            >
              요약 {stats.completion}% · 일정 {blocks.length} · 할일 {tasks.length}
              <span className="accordion-chevron">{statsOpen ? " ▾" : " ▸"}</span>
            </button>
            {statsOpen ? (
              <div className="day-glance-bar day-glance-bar-mobile">
                <div className="glance-stat">
                  <strong>{stats.completion}%</strong>
                  <span>완료</span>
                </div>
                <div className="glance-stat">
                  <strong>{blocks.length}</strong>
                  <span>일정</span>
                </div>
                <div className="glance-stat">
                  <strong>{tasks.length}</strong>
                  <span>할일</span>
                </div>
                <div className="glance-stat">
                  <strong>{currentTime}</strong>
                  <span>현재</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="day-hero-footer">
            <div className="day-glance-bar">
              <div className="glance-stat">
                <strong>{stats.completion}%</strong>
                <span>완료</span>
              </div>
              <div className="glance-stat">
                <strong>{blocks.length}</strong>
                <span>일정</span>
              </div>
              <div className="glance-stat">
                <strong>{tasks.length}</strong>
                <span>할일</span>
              </div>
              <div className="glance-stat">
                <strong>{currentTime}</strong>
                <span>현재</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {!mobileLayout ? (
        <>
      <section className="panel plan-panel accordion-panel secondary-panel">
        <button
          type="button"
          className="accordion-trigger"
          aria-expanded={planOpen}
          onClick={() => setPlanOpen((open) => !open)}
        >
          <h2 className="section-title">계획</h2>
          <span className="accordion-chevron">{planOpen ? "▾" : "▸"}</span>
        </button>
        {planOpen ? (
          <div className="accordion-body">
            <DayPlanForm
              key={activeDate}
              initial={{
                mainGoal: day?.main_goal ?? "",
                avoidThing: day?.avoid_text ?? "",
                focusWindow: day?.focus_window ?? "",
              }}
              onSave={saveDayPlan}
            />
          </div>
        ) : null}
      </section>

      <section className="panel notes-preview-panel secondary-panel">
        <div className="panel-header compact-header">
          <h2 className="section-title">메모</h2>
          <button
            className="ghost-btn small add-chip"
            type="button"
            onClick={() => {
              setMoreSubView("notes");
              setActiveView("more", { keepMoreSub: true });
            }}
          >
            전체
          </button>
        </div>
        {notes.length ? (
          <div className="note-list compact-note-list">
            {notes.slice(0, 3).map((note) => (
              <article key={note.id} className="note-card compact">
                <div className="meta-row">
                  <span className="tag">{note.note_type === "voice" ? "음성" : "텍스트"}</span>
                  <span className="tag">
                    {new Date(note.created_at).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p>{note.content || "음성 메모"}</p>
                <button
                  type="button"
                  className="ghost-btn small"
                  onClick={async () => {
                    if (confirm("이 메모를 삭제할까요?")) await removeNote(note);
                  }}
                >
                  삭제
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            메모가 없습니다.{" "}
            <button type="button" className="link-btn" onClick={() => openQuickCapture("note")}>
              메모 추가
            </button>
          </div>
        )}
      </section>

      <section className="panel reminder-panel mobile-collapsed-panel secondary-panel">
        <div className="panel-header compact-header">
          <h2 className="section-title">알림</h2>
          <button
            type="button"
            className="ghost-btn small add-chip"
            onClick={() => setReminderOpen((open) => !open)}
          >
            {reminderOpen ? "닫기" : "설정"}
          </button>
        </div>
        {reminderOpen ? (
          <ReminderForm
            onSave={async (time, message) => {
              if (!/^\d{2}:\d{2}$/.test(time)) {
                showToast("시간 형식은 15:30처럼 입력해주세요.");
                return;
              }
              await addReminderPrompt(time, message);
              setReminderOpen(false);
            }}
          />
        ) : (
          <p className="muted-hint">특정 시간에 메모 질문 알림을 받을 수 있습니다.</p>
        )}
      </section>
        </>
      ) : null}
    </div>
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

function ReminderForm({
  onSave,
}: {
  onSave: (time: string, message: string) => Promise<void>;
}) {
  return (
    <form
      className="stack-form reminder-form"
      onSubmit={async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        await onSave(String(data.get("time")), String(data.get("message")));
      }}
    >
      <div className="form-row">
        <label>
          알림 시간
          <input name="time" type="time" required defaultValue="15:30" />
        </label>
        <label>
          알림 메시지
          <input
            name="message"
            type="text"
            required
            defaultValue="지금 하고 있는 일과 다음 행동을 기록하세요."
          />
        </label>
      </div>
      <button className="primary-btn full" type="submit">
        알림 추가
      </button>
    </form>
  );
}
