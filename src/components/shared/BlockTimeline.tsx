"use client";

import { formatTimeFromDb } from "@/lib/date";
import {
  BLOCK_STATUS_LABEL,
  BLOCK_TYPE_LABEL,
  type ScheduleBlock,
} from "@/lib/types";

interface BlockTimelineProps {
  blocks: ScheduleBlock[];
  editable?: boolean;
  onDone?: (id: string) => void;
  onDoing?: (id: string) => void;
  onSkip?: (id: string) => void;
  onEdit?: (block: ScheduleBlock) => void;
  onDelete?: (id: string) => void;
  taskCountForBlock?: (blockId: string) => number;
}

export function BlockTimeline({
  blocks,
  editable = false,
  onDone,
  onDoing,
  onSkip,
  onEdit,
  onDelete,
  taskCountForBlock,
}: BlockTimelineProps) {
  if (!blocks.length) {
    return (
      <div className="empty-state">
        아직 일정 블록이 없습니다. 달력에서 날짜를 고르고 일정 하나를 추가해보세요.
      </div>
    );
  }

  return (
    <div className={`timeline ${editable ? "editable" : ""}`}>
      {blocks.map((block) => (
        <article key={block.id} className="timeline-item" data-block-id={block.id}>
          <div className="timeline-time">
            {formatTimeFromDb(block.start_time)}
            <br />~ {formatTimeFromDb(block.end_time)}
          </div>
          <div className="timeline-body">
            <strong>{block.title}</strong>
            <p>{block.memo || "메모 없음"}</p>
            <div className="meta-row">
              <span className="tag">{BLOCK_TYPE_LABEL[block.block_type]}</span>
              <span className={`tag status-${block.status}`}>
                {BLOCK_STATUS_LABEL[block.status]}
              </span>
              {taskCountForBlock ? (
                <span className="tag">연결 할 일 {taskCountForBlock(block.id)}개</span>
              ) : null}
            </div>
            {editable ? (
              <div className="item-actions">
                <button type="button" className="primary-mini" onClick={() => onDone?.(block.id)}>
                  완료
                </button>
                <button type="button" onClick={() => onDoing?.(block.id)}>
                  진행중
                </button>
                <button type="button" className="warning-mini" onClick={() => onSkip?.(block.id)}>
                  미룸
                </button>
                <button type="button" onClick={() => onEdit?.(block)}>
                  수정
                </button>
                <button type="button" onClick={() => onDelete?.(block.id)}>
                  삭제
                </button>
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
