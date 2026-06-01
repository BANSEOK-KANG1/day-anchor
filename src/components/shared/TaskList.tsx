"use client";

import { useState } from "react";
import { formatTimeFromDb } from "@/lib/date";
import { TASK_STATUS_LABEL, type ScheduleBlock, type Task } from "@/lib/types";

interface TaskListProps {
  tasks: Task[];
  blocks?: ScheduleBlock[];
  compact?: boolean;
  mobileMenu?: boolean;
  hideMeta?: boolean;
  nested?: boolean;
  onToggle?: (taskId: string, done: boolean) => void;
  onDone?: (taskId: string) => void;
  onSkip?: (taskId: string) => void;
  onCarry?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskList({
  tasks,
  blocks = [],
  compact = false,
  mobileMenu = false,
  hideMeta = false,
  nested = false,
  onToggle,
  onDone,
  onSkip,
  onCarry,
  onEdit,
  onDelete,
}: TaskListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (!tasks.length) {
    return (
      <div className="empty-state">
        아직 체크리스트가 없습니다. 오늘 꼭 끝낼 일 1개부터 추가해보세요.
      </div>
    );
  }

  const findBlockTitle = (blockId: string | null) => {
    if (!blockId) return "연결 일정 없음";
    return blocks.find((block) => block.id === blockId)?.title || "삭제된 일정";
  };

  const showActions = !compact || mobileMenu;

  return (
    <div className={`task-list ${compact ? "" : "large"} ${nested ? "nested" : ""}`}>
      {tasks.map((task) => {
        const done = task.status === "done";
        const statusClass =
          task.status === "done"
            ? "status-done"
            : task.status === "skipped"
              ? "status-skipped"
              : task.status === "carried"
                ? "status-carried"
                : "";

        return (
          <article key={task.id} className={`task-card ${nested ? "task-card-nested" : ""}`} data-task-id={task.id}>
            <input
              type="checkbox"
              checked={done}
              onChange={(e) => onToggle?.(task.id, e.target.checked)}
              aria-label="할 일 완료 처리"
            />
            <div className="task-card-body">
              <div className="task-card-head">
                <p className={`task-title ${done ? "done" : ""}`}>{task.title}</p>
                <div className="task-card-head-actions">
                {onDelete ? (
                  <button
                    type="button"
                    className="ghost-btn small task-delete-btn"
                    onClick={() => onDelete(task.id)}
                  >
                    삭제
                  </button>
                ) : null}
                {showActions && mobileMenu ? (
                  <div className="task-menu-wrap">
                    <button
                      type="button"
                      className="task-menu-btn"
                      aria-label="할 일 메뉴"
                      aria-expanded={openMenuId === task.id}
                      onClick={() =>
                        setOpenMenuId((id) => (id === task.id ? null : task.id))
                      }
                    >
                      ⋯
                    </button>
                    {openMenuId === task.id ? (
                      <div className="task-menu-popover">
                        <button type="button" onClick={() => { onDone?.(task.id); setOpenMenuId(null); }}>
                          완료
                        </button>
                        <button type="button" onClick={() => { onSkip?.(task.id); setOpenMenuId(null); }}>
                          미룸
                        </button>
                        <button type="button" onClick={() => { onCarry?.(task.id); setOpenMenuId(null); }}>
                          내일로
                        </button>
                        <button type="button" onClick={() => { onEdit?.(task); setOpenMenuId(null); }}>
                          수정
                        </button>
                        <button type="button" onClick={() => { onDelete?.(task.id); setOpenMenuId(null); }}>
                          삭제
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                </div>
              </div>
              {!hideMeta ? (
                <p className="task-meta">
                  {task.due_time ? `${formatTimeFromDb(task.due_time)} · ` : ""}
                  {findBlockTitle(task.schedule_block_id)} · 우선순위 {task.priority} ·{" "}
                  <span className={`tag ${statusClass}`}>{TASK_STATUS_LABEL[task.status]}</span>
                  {task.delay_reason ? (
                    <>
                      <br />
                      미룸 이유: {task.delay_reason}
                    </>
                  ) : null}
                </p>
              ) : (
                <p className="task-meta task-meta-min">
                  <span className={`tag ${statusClass}`}>{TASK_STATUS_LABEL[task.status]}</span>
                </p>
              )}
              {showActions && !mobileMenu ? (
                <div className="item-actions">
                  <button type="button" className="primary-mini" onClick={() => onDone?.(task.id)}>
                    완료
                  </button>
                  <button type="button" className="warning-mini" onClick={() => onSkip?.(task.id)}>
                    미룸
                  </button>
                  <button type="button" onClick={() => onCarry?.(task.id)}>
                    내일로
                  </button>
                  <button type="button" onClick={() => onEdit?.(task)}>
                    수정
                  </button>
                  <button type="button" onClick={() => onDelete?.(task.id)}>
                    삭제
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
