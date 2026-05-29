"use client";

import { FormEvent, useState } from "react";
import { timeToMinutes } from "@/lib/date";
import { useApp } from "@/contexts/AppContext";
import {
  BLOCK_STATUS_LABEL,
  BLOCK_TYPE_LABEL,
  type BlockStatus,
  type BlockType,
  type ScheduleBlock,
} from "@/lib/types";
import { BlockTimeline } from "@/components/shared/BlockTimeline";

const BLOCK_TYPES: BlockType[] = [
  "deep_work",
  "admin",
  "meeting",
  "move",
  "recovery",
  "capture",
  "review",
];

const BLOCK_STATUSES: BlockStatus[] = ["planned", "doing", "done", "skipped"];

export function ScheduleView() {
  const { blocks, tasks, saveScheduleBlock, setBlockStatus, removeBlock, showToast } = useApp();
  const [editing, setEditing] = useState<ScheduleBlock | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const start = String(form.get("start"));
    const end = String(form.get("end"));
    if (timeToMinutes(end) <= timeToMinutes(start)) {
      showToast("종료 시간은 시작 시간보다 뒤여야 합니다.");
      return;
    }
    await saveScheduleBlock({
      id: editing?.id,
      title: String(form.get("title")),
      start,
      end,
      type: String(form.get("type")) as BlockType,
      status: String(form.get("status")) as BlockStatus,
      memo: String(form.get("memo") ?? ""),
    });
    setEditing(null);
    event.currentTarget.reset();
  }

  return (
    <div className="grid two-col">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Time blocks</p>
            <h2>일정 블록 만들기</h2>
          </div>
        </div>
        <form key={editing?.id ?? "new"} className="stack-form" onSubmit={handleSubmit}>
          <label>
            일정 제목
            <input
              name="title"
              type="text"
              defaultValue={editing?.title ?? ""}
              placeholder="예: 포트폴리오 작업"
              required
            />
          </label>
          <div className="form-row">
            <label>
              시작
              <input
                name="start"
                type="time"
                defaultValue={editing?.start_time?.slice(0, 5) ?? "09:00"}
                required
              />
            </label>
            <label>
              종료
              <input
                name="end"
                type="time"
                defaultValue={editing?.end_time?.slice(0, 5) ?? "10:00"}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              유형
              <select name="type" defaultValue={editing?.block_type ?? "deep_work"}>
                {BLOCK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {BLOCK_TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              상태
              <select name="status" defaultValue={editing?.status ?? "planned"}>
                {BLOCK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {BLOCK_STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            간단 메모
            <textarea
              name="memo"
              rows={3}
              defaultValue={editing?.memo ?? ""}
              placeholder="이 시간에 무엇을 끝내면 좋은지 적어보세요."
            />
          </label>
          <div className="button-row">
            <button className="primary-btn" type="submit">
              일정 저장
            </button>
            <button
              className="ghost-btn"
              type="button"
              onClick={() => {
                setEditing(null);
              }}
            >
              초기화
            </button>
          </div>
        </form>
      </section>

      <section className="panel wide-list-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Editable timeline</p>
            <h2>일정 목록</h2>
          </div>
        </div>
        <BlockTimeline
          blocks={blocks}
          editable
          taskCountForBlock={(blockId) => tasks.filter((t) => t.schedule_block_id === blockId).length}
          onDone={(id) => setBlockStatus(id, "done")}
          onDoing={(id) => setBlockStatus(id, "doing")}
          onSkip={(id) => setBlockStatus(id, "skipped")}
          onEdit={(block) => setEditing(block)}
          onDelete={async (id) => {
            if (confirm("이 일정을 삭제할까요?")) await removeBlock(id);
          }}
        />
      </section>
    </div>
  );
}
