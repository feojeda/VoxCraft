"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileAudio, X, Loader2, Globe } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { VoiceResponse } from "@/lib/types";

interface VoiceUploaderProps {
  onUploadComplete?: (voice: VoiceResponse) => void;
}

export function VoiceUploader({ onUploadComplete }: VoiceUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [refText, setRefText] = useState("");
  const [name, setName] = useState("");
  const [xVectorOnlyMode, setXVectorOnlyMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith("audio/")) {
      setError("Please upload an audio file (WAV, MP3, OGG)");
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("File is too large. Maximum size is 20 MB.");
      return;
    }
    setFile(selectedFile);
    setError(null);
    if (!name) {
      setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  }, [name]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleUpload = async () => {
    if (!file || !name.trim()) return;

    setIsUploading(true);
    setError(null);

    try {
      const voice = await apiClient.uploadVoice(file, refText.trim(), name.trim(), xVectorOnlyMode);
      setFile(null);
      setRefText("");
      setName("");
      setXVectorOnlyMode(false);
      onUploadComplete?.(voice);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const canUpload = file && name.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${
          isDragging
            ? "border-[var(--accent)] bg-[var(--accent)]/10"
            : file
              ? "border-[var(--accent)] bg-[var(--accent)]/5"
              : "border-[var(--border)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/wav,audio/mpeg,audio/mp3,audio/ogg,audio/webm"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
          }}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileAudio className="h-5 w-5 text-[var(--accent)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {file.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="rounded-full p-1 hover:bg-[var(--surface-hover)]"
            >
              <X className="h-4 w-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto h-8 w-8 text-[var(--text-secondary)]" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Drop audio file here or click to browse
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              WAV, MP3, OGG — Max 20 MB
            </p>
          </div>
        )}
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
          The exact text spoken in the audio file.
        </p>
        <textarea
          value={refText}
          onChange={(e) => setRefText(e.target.value)}
          placeholder="Type what is said in the audio..."
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

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!canUpload || isUploading}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
          canUpload && !isUploading
            ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
            : "cursor-not-allowed bg-[var(--surface-hover)] text-[var(--text-secondary)]"
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          "Upload Voice"
        )}
      </button>
    </div>
  );
}
