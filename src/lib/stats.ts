import type {
  ActivityEvent,
  DayRecord,
  DayStats,
  Note,
  Reminder,
  ScheduleBlock,
  Task,
} from "./types";

interface StatsInput {
  day: DayRecord | null;
  blocks: ScheduleBlock[];
  tasks: Task[];
  notes: Note[];
}

export function calculateStats({
  day,
  blocks,
  tasks,
  notes,
}: StatsInput): DayStats {
  const taskCompletion = tasks.length
    ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100)
    : 0;
  const blockCompletion = blocks.length
    ? Math.round((blocks.filter((b) => b.status === "done").length / blocks.length) * 100)
    : 0;
  const completion =
    tasks.length && blocks.length
      ? Math.round(taskCompletion * 0.65 + blockCompletion * 0.35)
      : Math.max(taskCompletion, blockCompletion);
  const memoCount = notes.length;
  const voiceCount = notes.filter((n) => n.note_type === "voice").length;
  const delayedTasks = tasks.filter((t) =>
    ["skipped", "carried"].includes(t.status),
  ).length;
  const morningPlanBonus = day?.main_goal ? 10 : 0;
  const reviewBonus = day?.review_completed ? 10 : 0;
  const memoBonus = Math.min(memoCount * 4, 16);
  const flowScore = Math.min(
    100,
    Math.round(completion * 0.64 + morningPlanBonus + reviewBonus + memoBonus),
  );

  return {
    completion,
    taskCompletion,
    blockCompletion,
    flowScore,
    taskCount: tasks.length,
    doneTaskCount: tasks.filter((t) => t.status === "done").length,
    delayedTasks,
    carryCount: tasks.filter((t) => t.status === "carried").length,
    blockCount: blocks.length,
    memoCount,
    voiceCount,
  };
}

export function getCurrentBlock(
  blocks: ScheduleBlock[],
  activeDate: string,
): ScheduleBlock | undefined {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (activeDate !== todayString) return undefined;

  const now = today.getHours() * 60 + today.getMinutes();
  return blocks.find((block) => {
    const [sh, sm] = block.start_time.split(":").map(Number);
    const [eh, em] = block.end_time.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return start <= now && now < end;
  });
}

export function buildInsightCards(
  dates: string[],
  getBundle: (date: string) => {
    day: DayRecord | null;
    blocks: ScheduleBlock[];
    tasks: Task[];
    notes: Note[];
  },
): { label: string; value: string }[] {
  const statsByDate = dates.map((date) => ({
    date,
    ...calculateStats(getBundle(date)),
  }));
  const avgCompletion = Math.round(
    statsByDate.reduce((sum, item) => sum + item.completion, 0) / statsByDate.length,
  );
  const totalNotes = statsByDate.reduce((sum, item) => sum + item.memoCount, 0);
  const totalVoice = statsByDate.reduce((sum, item) => sum + item.voiceCount, 0);
  const totalBlocks = statsByDate.reduce((sum, item) => sum + item.blockCount, 0);
  const totalDelayed = statsByDate.reduce((sum, item) => sum + item.delayedTasks, 0);
  const morningPlanDays = dates.filter((date) => getBundle(date).day?.main_goal).length;

  return [
    { value: `${avgCompletion}%`, label: "평균 완료율" },
    { value: `${morningPlanDays}/7`, label: "아침 계획 작성일" },
    { value: String(totalBlocks), label: "일정 블록 수" },
    { value: String(totalNotes), label: "전체 메모" },
    { value: String(totalVoice), label: "음성메모" },
    { value: String(totalDelayed), label: "미룸/이월 항목" },
  ];
}

export function serializeExport(
  days: DayRecord[],
  blocks: ScheduleBlock[],
  tasks: Task[],
  notes: Note[],
  reminders: Reminder[],
  events: ActivityEvent[],
) {
  return {
    days,
    scheduleBlocks: blocks,
    tasks,
    notes,
    reminders,
    events,
    exportedAt: new Date().toISOString(),
  };
}
