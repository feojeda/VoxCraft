"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, FileAudio, Mic, Square, Trash2, Globe } from "lucide-react";

type SourceTab = "upload" | "record";

interface VoiceCloneInputProps {
  refAudio: string | null;
  refText: string;
  xVectorOnlyMode: boolean;
  onRefAudioChange: (base64: string | null) => void;
  onRefTextChange: (text: string) => void;
  onXVectorOnlyModeChange: (value: boolean) => void;
}

export function VoiceCloneInput({
  refAudio,
  refText,
  xVectorOnlyMode,
  onRefAudioChange,
  onRefTextChange,
  onXVectorOnlyModeChange,
}: VoiceCloneInputProps) {
  const [activeTab, setActiveTab] = useState<SourceTab>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recording state
  const [recorderState, setRecorderState] = useState<"idle" | "recording" | "preview">("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDuration = 60;
  const minDuration = 3;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onRefAudioChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      setRecorderError(null);
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
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecorderState("preview");
        stream.getTracks().forEach((t) => t.stop());

        // Convert blob to base64 for the parent
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onRefAudioChange(base64);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setRecorderState("recording");
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
      setRecorderError(
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
    setRecorderState("idle");
  }, []);

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setRecorderState("idle");
    onRefAudioChange(null);
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

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("upload");
          }}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "upload"
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload Audio
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("record");
          }}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "record"
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Mic className="h-4 w-4" />
          Record Audio
        </button>
      </div>

      {/* Upload panel */}
      {activeTab === "upload" && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-secondary)]">
            Upload a short audio clip (5-30s) of the voice you want to clone.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex w-full items-center gap-3 rounded-lg border border-dashed p-4 transition-all ${
              refAudio && activeTab === "upload"
                ? "border-[var(--accent)] bg-[var(--accent)]/5"
                : "border-[var(--border)] hover:border-[var(--text-secondary)]"
            }`}
          >
            {refAudio && activeTab === "upload" ? (
              <FileAudio className="h-5 w-5 text-[var(--accent)]" />
            ) : (
              <Upload className="h-5 w-5 text-[var(--text-secondary)]" />
            )}
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {fileName || "Click to upload audio"}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {refAudio && activeTab === "upload" ? "Audio uploaded" : "WAV, MP3, or FLAC"}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Record panel */}
      {activeTab === "record" && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--text-secondary)]">
            Record a short clip (3-60s) of your voice.
          </p>

          <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
            {recorderState === "idle" && (
              <button
                type="button"
                onClick={startRecording}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--error)] text-white shadow-lg transition-transform hover:scale-105"
                aria-label="Start recording"
              >
                <Mic className="h-6 w-6" />
              </button>
            )}

            {recorderState === "recording" && (
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
                  type="button"
                  onClick={stopRecording}
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-[var(--text-primary)] transition-colors hover:bg-[var(--border)]"
                  aria-label="Stop recording"
                >
                  <Square className="h-5 w-5 fill-current" />
                </button>
              </div>
            )}

            {recorderState === "preview" && audioUrl && (
              <div className="w-full space-y-3">
                <audio src={audioUrl} controls className="w-full" />
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={discardRecording}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Discard
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-[var(--text-secondary)]">
              {recorderState === "idle"
                ? "Click the microphone to start recording"
                : recorderState === "recording"
                  ? "Speak clearly into your microphone"
                  : "Review your recording below"}
            </p>
          </div>

          {recorderError && (
            <div className="rounded-md bg-[var(--error)]/10 px-3 py-2 text-sm text-[var(--error)]">
              {recorderError}
            </div>
          )}
        </div>
      )}

      {/* Reference text */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          Reference Transcript <span className="text-[var(--error)]">*</span>
        </label>
        <p className="text-xs text-[var(--text-secondary)]">
          The exact text spoken in the reference audio. Improves cloning quality.
        </p>
        <textarea
          value={refText}
          onChange={(e) => onRefTextChange(e.target.value)}
          placeholder="Type what is said in the reference audio..."
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          rows={3}
        />
      </div>

      {/* x-vector only mode toggle */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={xVectorOnlyMode}
            onChange={(e) => onXVectorOnlyModeChange(e.target.checked)}
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
    </div>
  );
}
