"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { timeToMinutes } from "@/lib/date";
import { useApp } from "@/contexts/AppContext";
import type { QuickCaptureTab } from "@/lib/types";

const TABS: { id: QuickCaptureTab; label: string }[] = [
  { id: "schedule", label: "일정" },
  { id: "task", label: "할 일" },
  { id: "note", label: "메모" },
  { id: "voice", label: "음성" },
];

function defaultEndTime(start: string): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + 60;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

export function QuickCaptureSheet() {
  const {
    quickCaptureOpen,
    quickCaptureTab,
    closeQuickCapture,
    openQuickCapture,
    saveScheduleBlock,
    saveTask,
    saveTextNote,
    saveVoiceNote,
    blocks,
    currentBlock,
    setMoreSubView,
    setActiveView,
    showToast,
  } = useApp();

  const [recording, setRecording] = useState(false);
  const [recorderStatus, setRecorderStatus] = useState("탭하여 녹음 시작");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!quickCaptureOpen) {
      setRecording(false);
      setRecorderStatus("탭하여 녹음 시작");
    }
  }, [quickCaptureOpen]);

  if (!quickCaptureOpen) return null;

  async function handleScheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const start = String(data.get("start"));
    const end = String(data.get("end"));
    if (timeToMinutes(end) <= timeToMinutes(start)) {
      showToast("종료 시간은 시작 시간보다 뒤여야 합니다.");
      return;
    }
    await saveScheduleBlock({
      title: String(data.get("title")),
      start,
      end,
      type: "deep_work",
      status: "planned",
      memo: "",
    });
    closeQuickCapture();
    event.currentTarget.reset();
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await saveTask({
      title: String(data.get("title")),
      priority: 2,
      blockId: String(data.get("blockId") || "") || null,
      dueTime: null,
      status: "todo",
    });
    closeQuickCapture();
    event.currentTarget.reset();
  }

  async function handleNoteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const blockId = String(data.get("blockId") || "") || currentBlock?.id || null;
    await saveTextNote(String(data.get("content")), blockId);
    closeQuickCapture();
    event.currentTarget.reset();
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecorderStatus("이 브라우저에서는 음성 녹음을 지원하지 않습니다.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const seconds = Math.round((Date.now() - startedAtRef.current) / 1000);
        await saveVoiceNote(blob, seconds, currentBlock?.id ?? null);
        closeQuickCapture();
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setRecording(true);
      setRecorderStatus("녹음 중… 종료하려면 버튼을 다시 누르세요.");
    } catch {
      setRecorderStatus("마이크 권한을 확인해주세요.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    setRecording(false);
    setRecorderStatus("저장 중…");
  }

  function openDetail(view: "schedule" | "tasks" | "notes") {
    closeQuickCapture();
    setMoreSubView(view);
    setActiveView("more", { keepMoreSub: true });
  }

  const blockOptions = [
    { value: "", label: "연결하지 않음" },
    ...blocks.map((block) => ({
      value: block.id,
      label: `${block.start_time.slice(0, 5)} · ${block.title}`,
    })),
  ];

  return (
    <div className="sheet-backdrop" onClick={closeQuickCapture} role="presentation">
      <div
        className="quick-capture-sheet"
        role="dialog"
        aria-label="빠른 입력"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={quickCaptureTab === tab.id ? "active" : ""}
              onClick={() => openQuickCapture(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {quickCaptureTab === "schedule" ? (
          <form className="stack-form" onSubmit={handleScheduleSubmit}>
            <label>
              제목
              <input name="title" type="text" required placeholder="예: 포트폴리오 작업" autoFocus />
            </label>
            <div className="form-row">
              <label>
                시작
                <input
                  name="start"
                  type="time"
                  required
                  defaultValue="09:00"
                  onChange={(e) => {
                    const endInput = e.currentTarget.form?.elements.namedItem("end") as HTMLInputElement | null;
                    if (endInput && !endInput.dataset.touched) {
                      endInput.value = defaultEndTime(e.currentTarget.value);
                    }
                  }}
                />
              </label>
              <label>
                종료
                <input
                  name="end"
                  type="time"
                  required
                  defaultValue="10:00"
                  onChange={(e) => {
                    e.currentTarget.dataset.touched = "1";
                  }}
                />
              </label>
            </div>
            <button className="primary-btn full" type="submit">
              저장
            </button>
            <button type="button" className="link-btn sheet-detail-link" onClick={() => openDetail("schedule")}>
              더 입력 (상세 편집)
            </button>
          </form>
        ) : null}

        {quickCaptureTab === "task" ? (
          <form className="stack-form" onSubmit={handleTaskSubmit}>
            <label>
              할 일
              <input name="title" type="text" required placeholder="예: 이미지 3장 교체" autoFocus />
            </label>
            <label>
              연결 일정 (선택)
              <select name="blockId" defaultValue={currentBlock?.id ?? ""}>
                {blockOptions.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-btn full" type="submit">
              저장
            </button>
            <button type="button" className="link-btn sheet-detail-link" onClick={() => openDetail("tasks")}>
              더 입력 (상세 편집)
            </button>
          </form>
        ) : null}

        {quickCaptureTab === "note" ? (
          <form className="stack-form" onSubmit={handleNoteSubmit}>
            <label>
              메모
              <textarea
                name="content"
                rows={4}
                required
                placeholder="지금 떠오른 생각을 적어보세요."
                autoFocus
              />
            </label>
            <input type="hidden" name="blockId" value={currentBlock?.id ?? ""} />
            <button className="primary-btn full" type="submit">
              저장
            </button>
            <button type="button" className="link-btn sheet-detail-link" onClick={() => openDetail("notes")}>
              더 입력 (상세 편집)
            </button>
          </form>
        ) : null}

        {quickCaptureTab === "voice" ? (
          <div className="voice-quick">
            <p className="recorder-display">{recorderStatus}</p>
            <button
              type="button"
              className={recording ? "ghost-btn full" : "primary-btn full"}
              onClick={recording ? stopRecording : startRecording}
            >
              {recording ? "녹음 종료" : "녹음 시작"}
            </button>
          </div>
        ) : null}

        <button type="button" className="ghost-btn full sheet-close" onClick={closeQuickCapture}>
          닫기
        </button>
      </div>
    </div>
  );
}
