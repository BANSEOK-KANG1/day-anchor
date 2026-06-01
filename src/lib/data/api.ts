import type { SupabaseClient } from "@supabase/supabase-js";
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
} from "@/lib/types";

export async function ensureDay(
  supabase: SupabaseClient,
  userId: string,
  date: string,
): Promise<DayRecord> {
  const { data: existing } = await supabase
    .from("days")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (existing) return existing as DayRecord;

  const { data, error } = await supabase
    .from("days")
    .insert({
      user_id: userId,
      date,
      main_goal: "",
      avoid_text: "",
      focus_window: "",
      review_completed: false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as DayRecord;
}

export async function fetchDayBundle(
  supabase: SupabaseClient,
  userId: string,
  date: string,
) {
  const day = await ensureDay(supabase, userId, date);
  const dayId = day.id;

  const [blocksRes, tasksRes, notesRes, remindersRes] = await Promise.all([
    supabase
      .from("schedule_blocks")
      .select("*")
      .eq("day_id", dayId)
      .order("start_time"),
    supabase
      .from("tasks")
      .select("*")
      .eq("day_id", dayId)
      .order("priority")
      .order("due_time"),
    supabase
      .from("notes")
      .select("*, voice_memos(*)")
      .eq("day_id", dayId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reminders")
      .select("*")
      .eq("day_id", dayId)
      .order("remind_time"),
  ]);

  if (blocksRes.error) throw blocksRes.error;
  if (tasksRes.error) throw tasksRes.error;
  if (notesRes.error) throw notesRes.error;
  if (remindersRes.error) throw remindersRes.error;

  const notes = (notesRes.data ?? []).map((note) => ({
    ...note,
    voice_memo: Array.isArray(note.voice_memos)
      ? note.voice_memos[0] ?? null
      : note.voice_memos ?? null,
  })) as Note[];

  return {
    day,
    blocks: (blocksRes.data ?? []) as ScheduleBlock[],
    tasks: (tasksRes.data ?? []) as Task[],
    notes,
    reminders: (remindersRes.data ?? []) as Reminder[],
  };
}

export async function fetchMonthSummary(
  supabase: SupabaseClient,
  userId: string,
  monthStart: string,
) {
  const endDate = new Date(`${monthStart}T00:00:00`);
  endDate.setMonth(endDate.getMonth() + 1, 0);
  const monthEnd = endDate.toISOString().slice(0, 10);

  const { data: days, error: daysError } = await supabase
    .from("days")
    .select("*")
    .eq("user_id", userId)
    .gte("date", monthStart)
    .lte("date", monthEnd);

  if (daysError) throw daysError;
  const dayIds = (days ?? []).map((d) => d.id);
  if (!dayIds.length) {
    return { days: [] as DayRecord[], blocks: [] as ScheduleBlock[], tasks: [] as Task[], notes: [] as Note[] };
  }

  const [blocksRes, tasksRes, notesRes] = await Promise.all([
    supabase.from("schedule_blocks").select("*").in("day_id", dayIds),
    supabase.from("tasks").select("*").in("day_id", dayIds),
    supabase.from("notes").select("id, day_id, note_type").in("day_id", dayIds),
  ]);

  if (blocksRes.error) throw blocksRes.error;
  if (tasksRes.error) throw tasksRes.error;
  if (notesRes.error) throw notesRes.error;

  return {
    days: (days ?? []) as DayRecord[],
    blocks: (blocksRes.data ?? []) as ScheduleBlock[],
    tasks: (tasksRes.data ?? []) as Task[],
    notes: (notesRes.data ?? []) as Note[],
  };
}

export async function updateDayPlan(
  supabase: SupabaseClient,
  dayId: string,
  payload: {
    main_goal: string;
    avoid_text: string;
    focus_window: string;
  },
) {
  const { data, error } = await supabase
    .from("days")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", dayId)
    .select("*")
    .single();
  if (error) throw error;
  return data as DayRecord;
}

export async function saveReviewText(
  supabase: SupabaseClient,
  dayId: string,
  reviewText: string,
) {
  const { data, error } = await supabase
    .from("days")
    .update({ review_text: reviewText, updated_at: new Date().toISOString() })
    .eq("id", dayId)
    .select("*")
    .single();
  if (error) throw error;
  return data as DayRecord;
}

export async function completeReview(
  supabase: SupabaseClient,
  dayId: string,
  reviewText?: string,
) {
  const { data, error } = await supabase
    .from("days")
    .update({
      review_completed: true,
      ...(reviewText !== undefined ? { review_text: reviewText } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", dayId)
    .select("*")
    .single();
  if (error) throw error;
  return data as DayRecord;
}

export async function upsertScheduleBlock(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
  payload: {
    id?: string;
    title: string;
    start_time: string;
    end_time: string;
    block_type: BlockType;
    status: BlockStatus;
    memo: string;
  },
) {
  if (payload.id) {
    const { data, error } = await supabase
      .from("schedule_blocks")
      .update({
        title: payload.title,
        start_time: payload.start_time,
        end_time: payload.end_time,
        block_type: payload.block_type,
        status: payload.status,
        memo: payload.memo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as ScheduleBlock;
  }

  const { data, error } = await supabase
    .from("schedule_blocks")
    .insert({
      user_id: userId,
      day_id: dayId,
      title: payload.title,
      start_time: payload.start_time,
      end_time: payload.end_time,
      block_type: payload.block_type,
      status: payload.status,
      memo: payload.memo,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ScheduleBlock;
}

export async function updateBlockStatus(
  supabase: SupabaseClient,
  blockId: string,
  status: BlockStatus,
) {
  const { data, error } = await supabase
    .from("schedule_blocks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", blockId)
    .select("*")
    .single();
  if (error) throw error;
  return data as ScheduleBlock;
}

export async function deleteScheduleBlock(supabase: SupabaseClient, blockId: string) {
  const { error } = await supabase.from("schedule_blocks").delete().eq("id", blockId);
  if (error) throw error;
}

export async function upsertTask(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
  payload: {
    id?: string;
    title: string;
    priority: number;
    schedule_block_id: string | null;
    due_time: string | null;
    status: TaskStatus;
    delay_reason?: string | null;
  },
) {
  if (payload.id) {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: payload.title,
        priority: payload.priority,
        schedule_block_id: payload.schedule_block_id || null,
        due_time: payload.due_time || null,
        status: payload.status,
        delay_reason: payload.delay_reason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Task;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      day_id: dayId,
      title: payload.title,
      priority: payload.priority,
      schedule_block_id: payload.schedule_block_id || null,
      due_time: payload.due_time || null,
      status: payload.status,
      delay_reason: payload.delay_reason ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(supabase: SupabaseClient, taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function createTextNote(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
  content: string,
  scheduleBlockId: string | null,
) {
  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      day_id: dayId,
      content,
      note_type: "text",
      schedule_block_id: scheduleBlockId || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Note;
}

export async function createVoiceNote(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
  scheduleBlockId: string | null,
  blob: Blob,
  durationSec: number,
) {
  const noteRes = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      day_id: dayId,
      content: `음성메모 ${durationSec}초`,
      note_type: "voice",
      schedule_block_id: scheduleBlockId || null,
    })
    .select("*")
    .single();
  if (noteRes.error) throw noteRes.error;

  const note = noteRes.data as Note;
  const path = `${userId}/${note.id}.webm`;
  const upload = await supabase.storage.from("voice-memos").upload(path, blob, {
    contentType: blob.type || "audio/webm",
    upsert: true,
  });
  if (upload.error) throw upload.error;

  const voiceRes = await supabase
    .from("voice_memos")
    .insert({
      user_id: userId,
      note_id: note.id,
      file_url: path,
      duration_sec: durationSec,
    })
    .select("*")
    .single();
  if (voiceRes.error) throw voiceRes.error;

  return { note, voiceMemo: voiceRes.data };
}

export async function deleteNote(supabase: SupabaseClient, note: Note, userId: string) {
  if (note.note_type === "voice" && note.voice_memo?.file_url) {
    const path = `${userId}/${note.id}.webm`;
    await supabase.storage.from("voice-memos").remove([path]);
  }
  const { error } = await supabase.from("notes").delete().eq("id", note.id);
  if (error) throw error;
}

export async function createReminder(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
  remindTime: string,
  prompt: string,
) {
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      user_id: userId,
      day_id: dayId,
      remind_time: remindTime,
      prompt,
      fired: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Reminder;
}

export async function markReminderFired(supabase: SupabaseClient, reminderId: string) {
  const { error } = await supabase
    .from("reminders")
    .update({ fired: true, fired_at: new Date().toISOString() })
    .eq("id", reminderId);
  if (error) throw error;
}

export async function logActivityEvent(
  supabase: SupabaseClient,
  userId: string,
  dayId: string | null,
  eventName: string,
  properties: Record<string, unknown> = {},
) {
  await supabase.from("activity_events").insert({
    user_id: userId,
    day_id: dayId,
    event_name: eventName,
    properties,
  });
}

export async function fetchActivityEvents(
  supabase: SupabaseClient,
  userId: string,
  limit = 80,
): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from("activity_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ActivityEvent[];
}

export async function fetchInsightsBundle(
  supabase: SupabaseClient,
  userId: string,
  dates: string[],
) {
  const { data: days, error } = await supabase
    .from("days")
    .select("*")
    .eq("user_id", userId)
    .in("date", dates);
  if (error) throw error;

  const dayIds = (days ?? []).map((d) => d.id);
  if (!dayIds.length) {
    return { days: [] as DayRecord[], blocks: [] as ScheduleBlock[], tasks: [] as Task[], notes: [] as Note[] };
  }

  const [blocksRes, tasksRes, notesRes] = await Promise.all([
    supabase.from("schedule_blocks").select("*").in("day_id", dayIds),
    supabase.from("tasks").select("*").in("day_id", dayIds),
    supabase.from("notes").select("id, day_id, note_type").in("day_id", dayIds),
  ]);

  return {
    days: (days ?? []) as DayRecord[],
    blocks: (blocksRes.data ?? []) as ScheduleBlock[],
    tasks: (tasksRes.data ?? []) as Task[],
    notes: (notesRes.data ?? []) as Note[],
  };
}

export async function getSignedVoiceUrl(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
  storedPath?: string | null,
) {
  const path = storedPath || `${userId}/${noteId}.webm`;
  const { data, error } = await supabase.storage
    .from("voice-memos")
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
