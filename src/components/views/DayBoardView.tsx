"use client";

import { FormEvent, useState } from "react";
import {
  formatTimeFromDb,
  getLocalDateString,
} from "@/lib/date";
import { useApp } from "@/contexts/AppContext";
import {
  BLOCK_STATUS_LABEL,
  BLOCK_TYPE_LABEL,
  type ScheduleBlock,
} from "@/lib/types";
import { BlockTimeline } from "@/components/shared/BlockTimeline";
import { TaskList } from "@/components/shared/TaskList";

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
    seedSampleData,
    setBlockStatus,
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

  const todayString = getLocalDateString();
  const isToday = activeDate === todayString;
  const hour = new Date().getHours();
  const showReviewBanner = isToday && !day?.review_completed && hour >= 18;
  const planExpanded = isToday && hour < 12;
  const [planOpen, setPlanOpen] = useState(planExpanded);
  const [reminderOpen, setReminderOpen] = useState(false);

  const isEmpty =
    !day?.main_goal && !blocks.length && !tasks.length && !notes.length;

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

      <section className="panel now-panel">
        <div className="now-strip">
          <div className="now-strip-main">
            <h2 className="section-title">지금</h2>
            <span className="pill time-pill">{currentTime}</span>
          </div>
          <span className="pill completion-pill">{stats.completion}%</span>
        </div>
        {currentBlock && isToday ? (
          <CurrentMiniCard block={currentBlock} />
        ) : (
          <div className="empty-state compact-empty">
            {isToday ? "진행 중인 일정 없음" : "오늘 날짜에만 표시됩니다"}
          </div>
        )}
      </section>

      {isEmpty ? (
        <section className="panel empty-day-panel">
          <div className="empty-state">
            <p className="empty-lead">기록이 비어 있어요.</p>
            <div className="empty-actions">
              <button type="button" className="primary-btn full" onClick={() => openQuickCapture("schedule")}>
                + 일정 추가
              </button>
              <button type="button" className="ghost-btn full" onClick={() => seedSampleData()}>
                샘플 넣기
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel plan-panel accordion-panel">
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
            <button className="ghost-btn small" type="button" onClick={() => seedSampleData()}>
              샘플 채우기
            </button>
          </div>
        ) : null}
      </section>

      <section className="panel agenda-panel">
        <div className="panel-header compact-header">
          <h2 className="section-title">시간표</h2>
          <button className="ghost-btn small add-chip" type="button" onClick={() => openQuickCapture("schedule")}>
            추가
          </button>
        </div>
        <BlockTimeline
          blocks={blocks}
          editable
          onDone={(id) => setBlockStatus(id, "done")}
          onSkip={(id) => setBlockStatus(id, "skipped")}
        />
      </section>

      <section className="panel checklist-panel">
        <div className="panel-header compact-header">
          <h2 className="section-title">할 일</h2>
          <button className="ghost-btn small add-chip" type="button" onClick={() => openQuickCapture("task")}>
            추가
          </button>
        </div>
        <TaskList
          tasks={tasks}
          blocks={blocks}
          compact
          mobileMenu
          hideMeta
          onToggle={toggleTask}
          onDone={async (id) => {
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
          }}
          onSkip={async (id) => {
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
          }}
          onCarry={async (id) => {
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
          }}
          onEdit={() => {
            setMoreSubView("tasks");
            setActiveView("more", { keepMoreSub: true });
          }}
          onDelete={async (id) => {
            if (confirm("이 할 일을 삭제할까요?")) await removeTask(id);
          }}
        />
      </section>

      <section className="panel notes-preview-panel">
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

      <section className="panel reminder-panel mobile-collapsed-panel">
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
    </div>
  );
}

function CurrentMiniCard({ block }: { block: ScheduleBlock }) {
  return (
    <article className="timeline-item current-mini-card compact-current">
      <div className="timeline-time oneline-time">
        {formatTimeFromDb(block.start_time)}–{formatTimeFromDb(block.end_time)}
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
