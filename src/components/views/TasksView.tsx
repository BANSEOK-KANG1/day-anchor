"use client";

import { FormEvent, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { TASK_STATUS_LABEL, type Task, type TaskStatus } from "@/lib/types";
import { TaskList } from "@/components/shared/TaskList";

const TASK_STATUSES: TaskStatus[] = ["todo", "done", "skipped", "carried"];

function askDelayReason() {
  const reasons = ["시간 부족", "우선순위 변경", "집중력 저하", "외부 일정 발생", "생각보다 오래 걸림"];
  const answer = prompt(`미룸 이유를 적어주세요.\n예: ${reasons.join(", ")}`);
  return answer?.trim() || "이유 미기록";
}

export function TasksView() {
  const { blocks, tasks, saveTask, toggleTask, removeTask, showToast } = useApp();
  const [editing, setEditing] = useState<Task | null>(null);

  const blockOptions = [
    { value: "", label: "연결하지 않음" },
    ...blocks.map((block) => ({
      value: block.id,
      label: `${block.start_time.slice(0, 5)}-${block.end_time.slice(0, 5)} · ${block.title}`,
    })),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await saveTask({
      id: editing?.id,
      title: String(form.get("title")),
      priority: Number(form.get("priority")),
      blockId: String(form.get("blockId") || "") || null,
      dueTime: String(form.get("dueTime") || "") || null,
      status: String(form.get("status")) as TaskStatus,
    });
    setEditing(null);
    event.currentTarget.reset();
  }

  return (
    <div className="grid two-col">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Checklist</p>
            <h2>할 일 추가</h2>
          </div>
        </div>
        <form key={editing?.id ?? "new"} className="stack-form" onSubmit={handleSubmit}>
          <label>
            할 일
            <input
              name="title"
              type="text"
              defaultValue={editing?.title ?? ""}
              placeholder="예: 포트폴리오 이미지 3장 교체"
              required
            />
          </label>
          <div className="form-row">
            <label>
              우선순위
              <select name="priority" defaultValue={String(editing?.priority ?? 2)}>
                <option value="1">높음</option>
                <option value="2">보통</option>
                <option value="3">낮음</option>
              </select>
            </label>
            <label>
              연결 일정
              <select name="blockId" defaultValue={editing?.schedule_block_id ?? ""}>
                {blockOptions.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              마감 시간
              <input
                name="dueTime"
                type="time"
                defaultValue={editing?.due_time?.slice(0, 5) ?? ""}
              />
            </label>
            <label>
              상태
              <select name="status" defaultValue={editing?.status ?? "todo"}>
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="primary-btn full" type="submit">
            할 일 저장
          </button>
        </form>
      </section>

      <section className="panel wide-list-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Task queue</p>
            <h2>체크리스트 목록</h2>
          </div>
        </div>
        <TaskList
          tasks={tasks}
          blocks={blocks}
          onToggle={toggleTask}
          onDone={async (id) => {
            const task = tasks.find((item) => item.id === id);
            if (!task) return;
            await saveTask({ ...taskToPayload(task), status: "done" });
          }}
          onSkip={async (id) => {
            const task = tasks.find((item) => item.id === id);
            if (!task) return;
            await saveTask({
              ...taskToPayload(task),
              status: "skipped",
              delayReason: askDelayReason(),
            });
          }}
          onCarry={async (id) => {
            const task = tasks.find((item) => item.id === id);
            if (!task) return;
            await saveTask({
              ...taskToPayload(task),
              status: "carried",
              delayReason: "내일 처리 예정",
            });
          }}
          onEdit={(task) => {
            setEditing(task);
            showToast("할 일 수정 모드입니다.");
          }}
          onDelete={async (id) => {
            if (confirm("이 할 일을 삭제할까요?")) await removeTask(id);
          }}
        />
      </section>
    </div>
  );
}

function taskToPayload(task: Task) {
  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    blockId: task.schedule_block_id,
    dueTime: task.due_time,
    status: task.status,
    delayReason: task.delay_reason,
  };
}
