"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createTextNote,
  ensureDay,
  logActivityEvent,
  upsertScheduleBlock,
  upsertTask,
  updateDayPlan,
} from "@/lib/data/api";
import type { BlockStatus, BlockType } from "@/lib/types";

export default function ImportSettingsPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const fileInput = event.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("JSON 파일을 선택해주세요.");
      setLoading(false);
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const days = parsed.days ?? [];
      let imported = 0;

      for (const legacyDay of days) {
        const day = await ensureDay(supabase, user.id, legacyDay.date);
        await updateDayPlan(supabase, day.id, {
          main_goal: legacyDay.mainGoal ?? legacyDay.main_goal ?? "",
          avoid_text: legacyDay.avoidThing ?? legacyDay.avoid_text ?? "",
          focus_window: legacyDay.focusWindow ?? legacyDay.focus_window ?? "",
        });

        const dayBlocks = (parsed.scheduleBlocks ?? []).filter(
          (block: { date: string }) => block.date === legacyDay.date,
        );
        for (const block of dayBlocks) {
          await upsertScheduleBlock(supabase, user.id, day.id, {
            title: block.title,
            start_time: block.start,
            end_time: block.end,
            block_type: (block.type ?? "deep_work") as BlockType,
            status: ((block.status === "delayed" ? "skipped" : block.status) ??
              "planned") as BlockStatus,
            memo: block.memo ?? "",
          });
        }

        const dayTasks = (parsed.tasks ?? []).filter(
          (task: { date: string }) => task.date === legacyDay.date,
        );
        for (const task of dayTasks) {
          await upsertTask(supabase, user.id, day.id, {
            title: task.title,
            priority: Number(task.priority ?? 2),
            schedule_block_id: task.blockId || null,
            due_time: task.dueTime || null,
            status: task.status ?? "todo",
            delay_reason: task.delayReason ?? null,
          });
        }

        const dayNotes = (parsed.notes ?? []).filter(
          (note: { date: string; noteType?: string }) =>
            note.date === legacyDay.date && (note.noteType ?? "text") === "text",
        );
        for (const note of dayNotes) {
          await createTextNote(
            supabase,
            user.id,
            day.id,
            note.content ?? "",
            note.blockId || null,
          );
        }

        imported += 1;
      }

      await logActivityEvent(supabase, user.id, null, "data_imported", { days: imported });
      setMessage(`${imported}일치 데이터를 가져왔습니다. (음성메모는 Storage 재업로드 필요)`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "가져오기 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ width: "min(100%, 520px)" }}>
        <p className="eyebrow">Settings</p>
        <h1 style={{ margin: "8px 0 12px", letterSpacing: "-0.04em" }}>프로토타입 데이터 가져오기</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          프로토타입에서 내보낸 JSON 파일을 업로드하면 Supabase 계정으로 일정·할 일·텍스트 메모를
          이전합니다.
        </p>
        <form className="stack-form" onSubmit={handleImport} style={{ marginTop: 18 }}>
          <label>
            JSON 파일
            <input name="file" type="file" accept="application/json,.json" required />
          </label>
          {error && <p style={{ color: "#b45309", margin: 0 }}>{error}</p>}
          {message && <p style={{ color: "#166534", margin: 0 }}>{message}</p>}
          <button className="primary-btn full" type="submit" disabled={loading}>
            {loading ? "가져오는 중..." : "가져오기"}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          <Link href="/app">← 앱으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
