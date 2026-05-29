"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import {
  completeReview,
  createReminder,
  createTextNote,
  createVoiceNote,
  deleteNote,
  deleteScheduleBlock,
  deleteTask,
  ensureDay,
  fetchActivityEvents,
  fetchDayBundle,
  fetchInsightsBundle,
  fetchMonthSummary,
  logActivityEvent,
  markReminderFired,
  updateBlockStatus,
  updateDayPlan,
  upsertScheduleBlock,
  upsertTask,
} from "@/lib/data/api";
import {
  getLastNDates,
  getLocalDateString,
  monthStartString,
  nowTimeString,
  shiftDate,
  shiftMonth,
} from "@/lib/date";
import { buildInsightCards, calculateStats, getCurrentBlock } from "@/lib/stats";
import type {
  ActivityEvent,
  BlockStatus,
  BlockType,
  DayRecord,
  Note,
  Reminder,
  ScheduleBlock,
  Task,
  TaskStatus,
  ViewName,
} from "@/lib/types";

interface ToastState {
  message: string;
  visible: boolean;
}

interface AppContextValue {
  user: User | null;
  loading: boolean;
  activeDate: string;
  calendarCursor: string;
  activeView: ViewName;
  day: DayRecord | null;
  blocks: ScheduleBlock[];
  tasks: Task[];
  notes: Note[];
  reminders: Reminder[];
  events: ActivityEvent[];
  monthDays: DayRecord[];
  monthBlocks: ScheduleBlock[];
  monthTasks: Task[];
  monthNotes: Note[];
  insightDates: string[];
  insightDays: DayRecord[];
  insightBlocks: ScheduleBlock[];
  insightTasks: Task[];
  insightNotes: Note[];
  stats: ReturnType<typeof calculateStats>;
  currentBlock: ScheduleBlock | undefined;
  currentTime: string;
  toast: ToastState;
  supabaseReady: boolean;
  setActiveView: (view: ViewName) => void;
  setActiveDate: (date: string, syncMonth?: boolean) => Promise<void>;
  shiftDay: (delta: number) => Promise<void>;
  shiftMonthView: (delta: number) => Promise<void>;
  goToday: () => Promise<void>;
  showToast: (message: string) => void;
  saveDayPlan: (payload: { mainGoal: string; avoidThing: string; focusWindow: string }) => Promise<void>;
  saveScheduleBlock: (payload: {
    id?: string;
    title: string;
    start: string;
    end: string;
    type: BlockType;
    status: BlockStatus;
    memo: string;
  }) => Promise<void>;
  setBlockStatus: (blockId: string, status: BlockStatus) => Promise<void>;
  removeBlock: (blockId: string) => Promise<void>;
  saveTask: (payload: {
    id?: string;
    title: string;
    priority: number;
    blockId: string | null;
    dueTime: string | null;
    status: TaskStatus;
    delayReason?: string | null;
  }) => Promise<void>;
  toggleTask: (taskId: string, done: boolean) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  saveTextNote: (content: string, blockId: string | null) => Promise<void>;
  saveVoiceNote: (blob: Blob, durationSec: number, blockId: string | null) => Promise<void>;
  removeNote: (note: Note) => Promise<void>;
  addReminderPrompt: (time: string, prompt: string) => Promise<void>;
  finishReview: () => Promise<void>;
  seedSampleData: () => Promise<void>;
  exportData: () => void;
  refreshAll: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const supabaseReady = isSupabaseConfigured();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDateState] = useState(getLocalDateString());
  const [calendarCursor, setCalendarCursor] = useState(monthStartString(getLocalDateString()));
  const [activeView, setActiveView] = useState<ViewName>("today");
  const [day, setDay] = useState<DayRecord | null>(null);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [monthDays, setMonthDays] = useState<DayRecord[]>([]);
  const [monthBlocks, setMonthBlocks] = useState<ScheduleBlock[]>([]);
  const [monthTasks, setMonthTasks] = useState<Task[]>([]);
  const [monthNotes, setMonthNotes] = useState<Note[]>([]);
  const [insightDays, setInsightDays] = useState<DayRecord[]>([]);
  const [insightBlocks, setInsightBlocks] = useState<ScheduleBlock[]>([]);
  const [insightTasks, setInsightTasks] = useState<Task[]>([]);
  const [insightNotes, setInsightNotes] = useState<Note[]>([]);
  const [currentTime, setCurrentTime] = useState(nowTimeString());
  const [toast, setToast] = useState<ToastState>({ message: "", visible: false });

  const insightDates = useMemo(() => getLastNDates(activeDate, 7), [activeDate]);
  const stats = useMemo(
    () => calculateStats({ day, blocks, tasks, notes }),
    [day, blocks, tasks, notes],
  );
  const currentBlock = useMemo(
    () => getCurrentBlock(blocks, activeDate),
    [blocks, activeDate],
  );

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    window.setTimeout(() => setToast({ message: "", visible: false }), 2200);
  }, []);

  const loadDay = useCallback(
    async (date: string) => {
      if (!user) return;
      const bundle = await fetchDayBundle(supabase, user.id, date);
      setDay(bundle.day);
      setBlocks(bundle.blocks);
      setTasks(bundle.tasks);
      setNotes(bundle.notes);
      setReminders(bundle.reminders);
    },
    [supabase, user],
  );

  const loadMonth = useCallback(
    async (monthStart: string) => {
      if (!user) return;
      const summary = await fetchMonthSummary(supabase, user.id, monthStart);
      setMonthDays(summary.days);
      setMonthBlocks(summary.blocks);
      setMonthTasks(summary.tasks);
      setMonthNotes(summary.notes as Note[]);
    },
    [supabase, user],
  );

  const loadInsights = useCallback(async () => {
    if (!user) return;
    const bundle = await fetchInsightsBundle(supabase, user.id, insightDates);
    setInsightDays(bundle.days);
    setInsightBlocks(bundle.blocks);
    setInsightTasks(bundle.tasks);
    setInsightNotes(bundle.notes as Note[]);
  }, [supabase, user, insightDates]);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    const data = await fetchActivityEvents(supabase, user.id);
    setEvents(data);
  }, [supabase, user]);

  const refreshAll = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      loadDay(activeDate),
      loadMonth(calendarCursor),
      loadInsights(),
      loadEvents(),
    ]);
  }, [user, activeDate, calendarCursor, loadDay, loadMonth, loadInsights, loadEvents]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    refreshAll();
  }, [user, activeDate, calendarCursor, refreshAll]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("day-anchor-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "days", filter: `user_id=eq.${user.id}` },
        () => refreshAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedule_blocks", filter: `user_id=eq.${user.id}` },
        () => refreshAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` },
        () => refreshAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${user.id}` },
        () => refreshAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reminders", filter: `user_id=eq.${user.id}` },
        () => refreshAll(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refreshAll]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(nowTimeString());
      if (!user || !day) return;
      const compact = new Date().toTimeString().slice(0, 5);
      reminders.forEach(async (reminder) => {
        if (!reminder.fired && reminder.remind_time.slice(0, 5) === compact) {
          await markReminderFired(supabase, reminder.id);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Day Anchor 메모 알림", { body: reminder.prompt });
          }
          showToast(reminder.prompt);
          await logActivityEvent(supabase, user.id, day.id, "reminder_triggered", {
            reminderId: reminder.id,
          });
          refreshAll();
        }
      });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [supabase, user, day, reminders, refreshAll, showToast]);

  const setActiveDate = useCallback(
    async (date: string, syncMonth = true) => {
      setActiveDateState(date);
      if (syncMonth) setCalendarCursor(monthStartString(date));
      if (user) await loadDay(date);
    },
    [user, loadDay],
  );

  const shiftDay = useCallback(
    async (delta: number) => {
      await setActiveDate(shiftDate(activeDate, delta));
    },
    [activeDate, setActiveDate],
  );

  const shiftMonthView = useCallback(
    async (delta: number) => {
      const next = shiftMonth(calendarCursor, delta);
      setCalendarCursor(next);
      await setActiveDate(next, false);
    },
    [calendarCursor, setActiveDate],
  );

  const goToday = useCallback(async () => {
    await setActiveDate(getLocalDateString());
  }, [setActiveDate]);

  const withDay = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    return ensureDay(supabase, user.id, activeDate);
  }, [supabase, user, activeDate]);

  const saveDayPlan = useCallback(
    async (payload: { mainGoal: string; avoidThing: string; focusWindow: string }) => {
      const currentDay = await withDay();
      const updated = await updateDayPlan(supabase, currentDay.id, {
        main_goal: payload.mainGoal,
        avoid_text: payload.avoidThing,
        focus_window: payload.focusWindow,
      });
      setDay(updated);
      await logActivityEvent(supabase, user!.id, updated.id, "daily_plan_saved", {
        date: activeDate,
      });
      showToast("선택 날짜 보드가 저장되었습니다.");
      await refreshAll();
    },
    [supabase, user, activeDate, withDay, showToast, refreshAll],
  );

  const saveScheduleBlock = useCallback(
    async (payload: {
      id?: string;
      title: string;
      start: string;
      end: string;
      type: BlockType;
      status: BlockStatus;
      memo: string;
    }) => {
      const currentDay = await withDay();
      await upsertScheduleBlock(supabase, user!.id, currentDay.id, {
        id: payload.id,
        title: payload.title,
        start_time: payload.start,
        end_time: payload.end,
        block_type: payload.type,
        status: payload.status,
        memo: payload.memo,
      });
      showToast("일정이 저장되었습니다.");
      await refreshAll();
    },
    [supabase, user, withDay, showToast, refreshAll],
  );

  const setBlockStatus = useCallback(
    async (blockId: string, status: BlockStatus) => {
      await updateBlockStatus(supabase, blockId, status);
      await refreshAll();
    },
    [supabase, refreshAll],
  );

  const removeBlock = useCallback(
    async (blockId: string) => {
      await deleteScheduleBlock(supabase, blockId);
      showToast("일정이 삭제되었습니다.");
      await refreshAll();
    },
    [supabase, showToast, refreshAll],
  );

  const saveTask = useCallback(
    async (payload: {
      id?: string;
      title: string;
      priority: number;
      blockId: string | null;
      dueTime: string | null;
      status: TaskStatus;
      delayReason?: string | null;
    }) => {
      const currentDay = await withDay();
      await upsertTask(supabase, user!.id, currentDay.id, {
        id: payload.id,
        title: payload.title,
        priority: payload.priority,
        schedule_block_id: payload.blockId,
        due_time: payload.dueTime,
        status: payload.status,
        delay_reason: payload.delayReason,
      });
      showToast("할 일이 저장되었습니다.");
      await refreshAll();
    },
    [supabase, user, withDay, showToast, refreshAll],
  );

  const toggleTask = useCallback(
    async (taskId: string, done: boolean) => {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;
      await upsertTask(supabase, user!.id, task.day_id, {
        id: task.id,
        title: task.title,
        priority: task.priority,
        schedule_block_id: task.schedule_block_id,
        due_time: task.due_time,
        status: done ? "done" : "todo",
      });
      await refreshAll();
    },
    [supabase, user, tasks, refreshAll],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      await deleteTask(supabase, taskId);
      await refreshAll();
    },
    [supabase, refreshAll],
  );

  const saveTextNote = useCallback(
    async (content: string, blockId: string | null) => {
      const currentDay = await withDay();
      await createTextNote(supabase, user!.id, currentDay.id, content, blockId);
      showToast("메모가 저장되었습니다.");
      await refreshAll();
    },
    [supabase, user, withDay, showToast, refreshAll],
  );

  const saveVoiceNote = useCallback(
    async (blob: Blob, durationSec: number, blockId: string | null) => {
      const currentDay = await withDay();
      await createVoiceNote(supabase, user!.id, currentDay.id, blockId, blob, durationSec);
      showToast("음성메모가 저장되었습니다.");
      await refreshAll();
    },
    [supabase, user, withDay, showToast, refreshAll],
  );

  const removeNote = useCallback(
    async (note: Note) => {
      await deleteNote(supabase, note, user!.id);
      showToast("메모가 삭제되었습니다.");
      await refreshAll();
    },
    [supabase, user, showToast, refreshAll],
  );

  const addReminderPrompt = useCallback(
    async (time: string, prompt: string) => {
      const currentDay = await withDay();
      await createReminder(supabase, user!.id, currentDay.id, time, prompt);
      showToast(`${time} 메모 알림이 추가되었습니다.`);
      await refreshAll();
    },
    [supabase, user, withDay, showToast, refreshAll],
  );

  const finishReview = useCallback(async () => {
    const currentDay = await withDay();
    const updated = await completeReview(supabase, currentDay.id);
    setDay(updated);
    showToast("오늘 회고가 완료 처리되었습니다.");
    await refreshAll();
  }, [supabase, withDay, showToast, refreshAll]);

  const seedSampleData = useCallback(async () => {
    const currentDay = await withDay();
    await updateDayPlan(supabase, currentDay.id, {
      main_goal: "포트폴리오 케이스 페이지를 가설-실험-결과 구조로 정리하기",
      avoid_text: "의미 없는 앱 전환과 완벽주의로 시작을 미루는 것",
      focus_window: "10:00~12:00 집중작업",
    });

    if (!blocks.length) {
      const samples: [string, string, string, BlockType, BlockStatus, string][] = [
        ["08:30", "09:00", "아침 계획 정리", "review", "done", "오늘 핵심 목표와 시간표를 정리합니다."],
        ["10:00", "12:00", "포트폴리오 집중작업", "deep_work", "planned", "케이스 페이지의 문제정의와 지표 문장을 다듬습니다."],
        ["13:30", "14:30", "지원 공고 분석", "admin", "planned", "JD와 내 경험의 연결점을 정리합니다."],
        ["15:30", "16:00", "중간 메모 슬롯", "capture", "planned", "막힌 부분과 다음 행동을 기록합니다."],
        ["22:30", "23:00", "하루 회고", "review", "planned", "완료/미룸/내일 항목을 정리합니다."],
      ];
      for (const [start, end, title, type, status, memo] of samples) {
        await upsertScheduleBlock(supabase, user!.id, currentDay.id, {
          title,
          start_time: start,
          end_time: end,
          block_type: type,
          status,
          memo,
        });
      }
    }

    await refreshAll();
    showToast("샘플 데이터가 채워졌습니다.");
  }, [supabase, user, blocks.length, withDay, refreshAll, showToast]);

  const exportData = useCallback(() => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            day,
            blocks,
            tasks,
            notes,
            reminders,
            events,
            exportedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `day-anchor-export-${activeDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [day, blocks, tasks, notes, reminders, events, activeDate]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value: AppContextValue = {
    user,
    loading,
    activeDate,
    calendarCursor,
    activeView,
    day,
    blocks,
    tasks,
    notes,
    reminders,
    events,
    monthDays,
    monthBlocks,
    monthTasks,
    monthNotes,
    insightDates,
    insightDays,
    insightBlocks,
    insightTasks,
    insightNotes,
    stats,
    currentBlock,
    currentTime,
    toast,
    supabaseReady,
    setActiveView,
    setActiveDate,
    shiftDay,
    shiftMonthView,
    goToday,
    showToast,
    saveDayPlan,
    saveScheduleBlock,
    setBlockStatus,
    removeBlock,
    saveTask,
    toggleTask,
    removeTask,
    saveTextNote,
    saveVoiceNote,
    removeNote,
    addReminderPrompt,
    finishReview,
    seedSampleData,
    exportData,
    refreshAll,
    signOut,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useInsightCards() {
  const { insightDates, insightDays, insightBlocks, insightTasks, insightNotes } = useApp();
  return buildInsightCards(insightDates, (date) => {
    const day = insightDays.find((item) => item.date === date) ?? null;
    const dayId = day?.id;
    return {
      day,
      blocks: insightBlocks.filter((block) => block.day_id === dayId),
      tasks: insightTasks.filter((task) => task.day_id === dayId),
      notes: insightNotes.filter((note) => note.day_id === dayId),
    };
  });
}
