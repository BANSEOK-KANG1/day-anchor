"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSignedVoiceUrl } from "@/lib/data/api";
import { useApp } from "@/contexts/AppContext";
import type { Note } from "@/lib/types";

export function NotesView() {
  const { blocks, notes, currentBlock, saveTextNote, saveVoiceNote, removeNote, exportData } =
    useApp();
  const [recording, setRecording] = useState(false);
  const [recorderStatus, setRecorderStatus] = useState("대기 중");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const voiceBlockRef = useRef<HTMLSelectElement>(null);

  const blockOptions = [
    { value: "", label: "연결하지 않음" },
    ...blocks.map((block) => ({
      value: block.id,
      label: `${block.start_time.slice(0, 5)}-${block.end_time.slice(0, 5)} · ${block.title}`,
    })),
  ];

  async function handleTextSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await saveTextNote(String(form.get("content")), String(form.get("blockId") || "") || null);
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
        const blockId =
          voiceBlockRef.current?.value || currentBlock?.id || null;
        await saveVoiceNote(blob, seconds, blockId || null);
        setRecorderStatus("대기 중");
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setRecording(true);
      setRecorderStatus("녹음 중입니다. 말을 마치면 녹음 종료를 눌러주세요.");
    } catch {
      setRecorderStatus("마이크 권한을 확인해주세요.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    setRecording(false);
    setRecorderStatus("저장 중입니다...");
  }

  return (
    <div className="grid two-col">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Capture</p>
            <h2>텍스트 메모</h2>
          </div>
        </div>
        <form className="stack-form" onSubmit={handleTextSubmit}>
          <label>
            연결 일정
            <select name="blockId" defaultValue={currentBlock?.id ?? ""}>
              {blockOptions.map((option) => (
                <option key={option.value || "none"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            메모 내용
            <textarea
              name="content"
              rows={5}
              placeholder="지금 떠오른 생각, 막힌 지점, 다음 행동을 적어보세요."
              required
            />
          </label>
          <button className="primary-btn full" type="submit">
            메모 저장
          </button>
        </form>

        <div className="divider" />

        <div className="voice-box">
          <div>
            <p className="eyebrow">Voice memo</p>
            <h3>음성메모</h3>
            <p>녹음 후 현재 일정 또는 선택한 일정에 연결됩니다.</p>
          </div>
          <label>
            연결 일정
            <select ref={voiceBlockRef} defaultValue={currentBlock?.id ?? ""}>
              {blockOptions.map((option) => (
                <option key={option.value || "none"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="recorder-display">{recorderStatus}</div>
          <div className="button-row">
            <button
              className="danger-btn"
              type="button"
              disabled={recording}
              onClick={startRecording}
            >
              녹음 시작
            </button>
            <button
              className="ghost-btn"
              type="button"
              disabled={!recording}
              onClick={stopRecording}
            >
              녹음 종료
            </button>
          </div>
        </div>
      </section>

      <section className="panel wide-list-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Memory lane</p>
            <h2>오늘의 기록</h2>
          </div>
          <button className="ghost-btn" type="button" onClick={exportData}>
            JSON 내보내기
          </button>
        </div>
        <NoteList notes={notes} blocks={blocks} onDelete={removeNote} />
      </section>
    </div>
  );
}

function NoteList({
  notes,
  blocks,
  onDelete,
}: {
  notes: Note[];
  blocks: { id: string; title: string }[];
  onDelete: (note: Note) => Promise<void>;
}) {
  if (!notes.length) {
    return (
      <div className="empty-state">
        아직 메모가 없습니다. 텍스트 또는 음성으로 첫 기록을 남겨보세요.
      </div>
    );
  }

  return (
    <div className="note-list">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} blocks={blocks} onDelete={onDelete} />
      ))}
    </div>
  );
}

function NoteCard({
  note,
  blocks,
  onDelete,
}: {
  note: Note;
  blocks: { id: string; title: string }[];
  onDelete: (note: Note) => Promise<void>;
}) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const blockTitle =
    blocks.find((block) => block.id === note.schedule_block_id)?.title || "연결 일정 없음";

  useEffect(() => {
    if (note.note_type !== "voice") return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const signed = await getSignedVoiceUrl(
        supabase,
        data.user.id,
        note.id,
        note.voice_memo?.file_url,
      );
      setAudioUrl(signed);
    });
  }, [note.id, note.note_type, note.voice_memo?.file_url]);

  return (
    <article className="note-card" data-note-id={note.id}>
      <div className="meta-row">
        <span className="tag">
          {new Date(note.created_at).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="tag">{blockTitle}</span>
        <span className="tag">{note.note_type === "voice" ? "음성메모" : "텍스트"}</span>
      </div>
      <p>{note.content}</p>
      {note.note_type === "voice" ? (
        audioUrl ? (
          <audio controls src={audioUrl} />
        ) : (
          <div className="empty-state">음성 파일 불러오는 중...</div>
        )
      ) : null}
      <div className="item-actions">
        <button
          type="button"
          onClick={async () => {
            if (confirm("이 메모를 삭제할까요?")) await onDelete(note);
          }}
        >
          삭제
        </button>
      </div>
    </article>
  );
}
