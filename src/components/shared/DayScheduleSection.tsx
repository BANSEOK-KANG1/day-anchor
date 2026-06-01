"use client";

import { formatTimeFromDb } from "@/lib/date";
import {
  BLOCK_STATUS_LABEL,
  BLOCK_TYPE_LABEL,
  type ScheduleBlock,
  type Task,
} from "@/lib/types";
import { TaskList } from "@/components/shared/TaskList";

interface DayScheduleSectionProps {
  blocks: ScheduleBlock[];
  tasks: Task[];
  currentBlockId?: string | null;
  isToday: boolean;
  onBlockDone: (id: string) => void;
  onBlockSkip: (id: string) => void;
  onToggle: (taskId: string, done: boolean) => void;
  onTaskDone: (taskId: string) => void;
  onTaskSkip: (taskId: string) => void;
  onTaskCarry: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

export function DayScheduleSection({
  blocks,
  tasks,
  currentBlockId,
  isToday,
  onBlockDone,
  onBlockSkip,
  onToggle,
  onTaskDone,
  onTaskSkip,
  onTaskCarry,
  onTaskEdit,
  onTaskDelete,
}: DayScheduleSectionProps) {
  const unlinkedTasks = tasks.filter((task) => !task.schedule_block_id);

  if (!blocks.length && !unlinkedTasks.length) {
    return (
      <div className="empty-state">
        일정과 할 일이 없습니다. 아래 추가 버튼으로 시작해보세요.
      </div>
    );
  }

  return (
    <div className="day-schedule-stack">
      {blocks.map((block) => {
        const blockTasks = tasks.filter((task) => task.schedule_block_id === block.id);
        const isCurrent = isToday && block.id === currentBlockId;

        return (
          <section
            key={block.id}
            className={`schedule-group ${isCurrent ? "schedule-group-current" : ""}`}
          >
            <article className="schedule-block-row">
              <div className="schedule-block-time">
                {formatTimeFromDb(block.start_time)}–{formatTimeFromDb(block.end_time)}
              </div>
              <div className="schedule-block-main">
                <div className="schedule-block-head">
                  <strong>{block.title}</strong>
                  {isCurrent ? <span className="tag tag-current">지금</span> : null}
                </div>
                {block.memo ? <p className="schedule-block-memo">{block.memo}</p> : null}
                <div className="meta-row">
                  <span className="tag">{BLOCK_TYPE_LABEL[block.block_type]}</span>
                  <span className={`tag status-${block.status}`}>
                    {BLOCK_STATUS_LABEL[block.status]}
                  </span>
                  {blockTasks.length ? (
                    <span className="tag">할 일 {blockTasks.length}</span>
                  ) : null}
                </div>
                <div className="item-actions schedule-block-actions">
                  <button type="button" className="primary-mini" onClick={() => onBlockDone(block.id)}>
                    완료
                  </button>
                  <button type="button" className="warning-mini" onClick={() => onBlockSkip(block.id)}>
                    미룸
                  </button>
                </div>
              </div>
            </article>

            {blockTasks.length ? (
              <div className="schedule-nested-tasks">
                <TaskList
                  tasks={blockTasks}
                  compact
                  mobileMenu
                  hideMeta
                  nested
                  onToggle={onToggle}
                  onDone={onTaskDone}
                  onSkip={onTaskSkip}
                  onCarry={onTaskCarry}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                />
              </div>
            ) : null}
          </section>
        );
      })}

      {unlinkedTasks.length ? (
        <section className="schedule-group schedule-group-unlinked">
          <h3 className="schedule-subtitle">시간표 밖 할 일</h3>
          <div className="schedule-nested-tasks schedule-nested-tasks-root">
            <TaskList
              tasks={unlinkedTasks}
              compact
              mobileMenu
              hideMeta
              nested
              onToggle={onToggle}
              onDone={onTaskDone}
              onSkip={onTaskSkip}
              onCarry={onTaskCarry}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
