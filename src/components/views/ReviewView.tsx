"use client";

import { FormEvent, useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { TaskList } from "@/components/shared/TaskList";

export function ReviewView() {
  const {
    day,
    stats,
    tasks,
    blocks,
    finishReview,
    saveReviewNote,
    carryAllIncompleteTasks,
    saveTask,
    removeTask,
    showToast,
  } = useApp();

  const [reviewText, setReviewText] = useState(day?.review_text ?? "");

  useEffect(() => {
    setReviewText(day?.review_text ?? "");
  }, [day?.id, day?.review_text]);

  const flowDescription =
    stats.flowScore >= 80
      ? "계획-실행-기록 루프가 꽤 안정적입니다."
      : stats.flowScore >= 50
        ? "흐름은 잡혔지만 미룸 항목을 정리하면 더 좋아집니다."
        : "아침 계획 또는 첫 체크리스트부터 가볍게 시작해보세요.";

  const carryTasks = tasks.filter((task) =>
    ["todo", "skipped", "carried"].includes(task.status),
  );

  async function handleReviewSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveReviewNote(reviewText);
  }

  return (
    <div className="grid two-col">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Daily review</p>
            <h2>하루 회고</h2>
          </div>
          <button
            className="primary-btn small"
            type="button"
            onClick={() => finishReview(reviewText)}
          >
            회고 완료
          </button>
        </div>
        <div className="score-card">
          <span>오늘의 흐름 점수</span>
          <strong>{stats.flowScore}점</strong>
          <p>{flowDescription}</p>
        </div>
        <div className="review-grid">
          <div>
            <strong>{stats.doneTaskCount}</strong>
            <span>완료한 일</span>
          </div>
          <div>
            <strong>{stats.delayedTasks}</strong>
            <span>미룬 일</span>
          </div>
          <div>
            <strong>{stats.memoCount}</strong>
            <span>메모</span>
          </div>
          <div>
            <strong>{stats.carryCount}</strong>
            <span>내일로 넘김</span>
          </div>
        </div>

        <form className="stack-form review-text-form" onSubmit={handleReviewSave}>
          <label>
            한 줄 회고
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="오늘 가장 잘한 것, 내일 바꿀 것을 한 줄로 적어보세요."
            />
          </label>
          <div className="button-row">
            <button className="secondary-btn" type="submit">
              회고 저장
            </button>
            <button className="ghost-btn" type="button" onClick={() => carryAllIncompleteTasks()}>
              미완료 전부 내일로
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Carry-over</p>
            <h2>내일로 넘길 항목</h2>
          </div>
        </div>
        {carryTasks.length ? (
          <TaskList
            tasks={carryTasks}
            blocks={blocks}
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
            onEdit={() => showToast("할 일 상세에서 수정하세요.")}
            onDelete={async (id) => {
              if (confirm("이 할 일을 삭제할까요?")) await removeTask(id);
            }}
          />
        ) : (
          <div className="empty-state">내일로 넘길 항목이 없습니다.</div>
        )}
      </section>
    </div>
  );
}
