"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Play, Trash2, Loader2, Globe } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { VoiceResponse } from "@/lib/types";

interface VoiceRecorderProps {
  onRecordComplete?: (voice: VoiceResponse) => void;
}

type RecorderState = "idle" | "recording" | "stopped" | "preview";

export function VoiceRecorder({ onRecordComplete }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [refText, setRefText] = useState("");
  const [name, setName] = useState("");
  const [xVectorOnlyMode, setXVectorOnlyMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDuration = 60;
  const minDuration = 3;

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("preview");
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setState("recording");
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 0.1;
          if (next >= maxDuration) {
            stopRecording();
          }
          return next;
        });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not access microphone. Please check permissions."
      );
    }
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setState("stopped");
  }, []);

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setState("idle");
  };

  const handleUpload = async () => {
    if (!audioBlob || !refText.trim() || !name.trim()) return;

    setIsUploading(true);
    setError(null);

    try {
      const file = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
      });
      const voice = await apiClient.uploadVoice(file, refText.trim(), name.trim(), xVectorOnlyMode);
      resetRecording();
      setRefText("");
      setName("");
      setXVectorOnlyMode(false);
      onRecordComplete?.(voice);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const canSave =
    audioBlob &&
    refText.trim().length > 0 &&
    name.trim().length > 0 &&
    recordingTime >= minDuration;

  return (
    <div className="space-y-4">
      {/* Recording controls */}
      <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        {state === "idle" && (
          <button
            onClick={startRecording}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--error)] text-white shadow-lg transition-transform hover:scale-105"
            aria-label="Start recording"
          >
            <Mic className="h-6 w-6" />
          </button>
        )}

        {(state === "recording" || state === "stopped") && (
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--error)]/20">
              <div className="h-3 w-3 animate-pulse rounded-full bg-[var(--error)]" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                {formatTime(recordingTime)}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {recordingTime < minDuration
                  ? `Record at least ${minDuration}s`
                  : "Recording..."}
              </p>
            </div>
            <button
              onClick={stopRecording}
              disabled={state === "stopped"}
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-[var(--text-primary)] transition-colors hover:bg-[var(--border)] disabled:opacity-50"
              aria-label="Stop recording"
            >
              <Square className="h-5 w-5 fill-current" />
            </button>
          </div>
        )}

        {state === "preview" && audioUrl && (
          <div className="w-full space-y-3">
            <audio src={audioUrl} controls className="w-full" />
            <div className="flex justify-center gap-2">
              <button
                onClick={resetRecording}
                className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                <Trash2 className="h-4 w-4" />
                Discard
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-[var(--text-secondary)]">
          {state === "idle"
            ? "Click the microphone to start recording"
            : state === "recording"
              ? "Speak clearly into your microphone"
              : "Review your recording below"}
        </p>
      </div>

      {/* Name input */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          Voice Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., My Voice"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {/* Reference text */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          Reference Transcript <span className="text-[var(--error)]">*</span>
        </label>
        <p className="text-xs text-[var(--text-secondary)]">
          The exact text you spoke in the recording.
        </p>
        <textarea
          value={refText}
          onChange={(e) => setRefText(e.target.value)}
          placeholder="Type what you said..."
          rows={3}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {/* x-vector only mode toggle */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={xVectorOnlyMode}
            onChange={(e) => setXVectorOnlyMode(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
              <Globe className="h-4 w-4 text-[var(--accent)]" />
              Native accent for other languages
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              When enabled, the cloned voice will keep its timbre but use the native
              prosody and accent of the target language. Recommended when generating
              speech in a different language than the reference audio.
            </p>
          </div>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-[var(--error)]/10 px-3 py-2 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleUpload}
        disabled={!canSave || isUploading}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
          canSave && !isUploading
            ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
            : "cursor-not-allowed bg-[var(--surface-hover)] text-[var(--text-secondary)]"
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Recording"
        )}
      </button>
    </div>
  );
}
