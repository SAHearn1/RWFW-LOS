"use client";

import { useCallback, useRef, useState } from "react";
import { Mic, Square, Play, Trash2 } from "lucide-react";

export type VoiceNote = {
  base64: string;
  mimeType: string;
  durationSeconds: number;
};

type Props = {
  onVoiceNote: (note: VoiceNote | null) => void;
  currentNote?: VoiceNote | null;
};

export default function VoiceNoteInput({ onVoiceNote, currentNote }: Props) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        const reader = new FileReader();
        reader.onload = () => {
          onVoiceNote({ base64: reader.result as string, mimeType, durationSeconds });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      mediaRef.current = recorder;
      startTimeRef.current = Date.now();
      setElapsed(0);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access to record.");
    }
  }, [onVoiceNote]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
    setRecording(false);
  }, []);

  const playNote = useCallback(() => {
    if (!currentNote) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(currentNote.base64);
    audioRef.current = audio;
    audio.play().catch(() => setError("Could not play audio."));
  }, [currentNote]);

  if (currentNote) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
        <Mic className="h-3.5 w-3.5 text-rootwork-teal shrink-0" />
        <span className="flex-1 text-slate-700">Voice note ({currentNote.durationSeconds}s)</span>
        <button type="button" onClick={playNote} className="rounded p-1 hover:bg-slate-200 transition-colors">
          <Play className="h-3.5 w-3.5 text-slate-500" />
        </button>
        <button type="button" onClick={() => onVoiceNote(null)} className="rounded p-1 hover:bg-red-50 transition-colors">
          <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {recording ? (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5 text-red-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording {elapsed}s
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="ml-auto flex items-center gap-1 rounded-lg border border-red-300 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            <Square className="h-3 w-3" />
            Stop
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-rootwork-teal hover:text-rootwork-teal transition-colors"
        >
          <Mic className="h-3.5 w-3.5" />
          Record voice note
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
