export type BlockType =
  | "deep_work"
  | "admin"
  | "meeting"
  | "move"
  | "recovery"
  | "capture"
  | "review";

export type BlockStatus = "planned" | "doing" | "done" | "skipped";
export type TaskStatus = "todo" | "done" | "skipped" | "carried";
export type NoteType = "text" | "voice";
export type ViewName = "day" | "month" | "more";
export type MoreSubView = "menu" | "review" | "insights" | "schedule" | "tasks" | "notes";
export type QuickCaptureTab = "schedule" | "task" | "note" | "voice";

export interface DayRecord {
  id: string;
  user_id: string;
  date: string;
  main_goal: string | null;
  avoid_text: string | null;
  focus_window: string | null;
  review_text: string | null;
  review_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleBlock {
  id: string;
  user_id: string;
  day_id: string;
  title: string;
  start_time: string;
  end_time: string;
  block_type: BlockType;
  status: BlockStatus;
  memo: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  day_id: string;
  schedule_block_id: string | null;
  title: string;
  status: TaskStatus;
  priority: number;
  due_time: string | null;
  delay_reason: string | null;
  carried_from: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  day_id: string;
  schedule_block_id: string | null;
  content: string | null;
  note_type: NoteType;
  created_at: string;
  voice_memo?: VoiceMemo | null;
}

export interface VoiceMemo {
  id: string;
  user_id: string;
  note_id: string;
  file_url: string;
  duration_sec: number | null;
  transcript: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  day_id: string;
  remind_time: string;
  prompt: string;
  fired: boolean;
  fired_at: string | null;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  day_id: string | null;
  event_name: string;
  properties: Record<string, unknown>;
  created_at: string;
}

export interface DayStats {
  completion: number;
  taskCompletion: number;
  blockCompletion: number;
  flowScore: number;
  taskCount: number;
  doneTaskCount: number;
  delayedTasks: number;
  carryCount: number;
  blockCount: number;
  memoCount: number;
  voiceCount: number;
}

export interface DayBundle {
  day: DayRecord | null;
  blocks: ScheduleBlock[];
  tasks: Task[];
  notes: Note[];
  reminders: Reminder[];
}

export const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  deep_work: "집중작업",
  admin: "잡무",
  meeting: "미팅/약속",
  move: "이동",
  recovery: "휴식",
  capture: "메모",
  review: "회고",
};

export const BLOCK_STATUS_LABEL: Record<BlockStatus, string> = {
  planned: "예정",
  doing: "진행중",
  done: "완료",
  skipped: "미룸",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "대기",
  done: "완료",
  skipped: "미룸",
  carried: "내일로 넘김",
};

export const VIEW_LABEL: Record<ViewName, string> = {
  day: "오늘",
  month: "달력",
  more: "더보기",
};

export const NAV_VIEWS: ViewName[] = ["day", "month", "more"];

export const MORE_SUB_LABEL: Record<Exclude<MoreSubView, "menu">, string> = {
  review: "회고",
  insights: "분석",
  schedule: "일정 상세",
  tasks: "할 일 상세",
  notes: "메모 상세",
};
