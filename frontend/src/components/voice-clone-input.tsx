"use client";

import { useState, useRef } from "react";
import { Upload, FileAudio } from "lucide-react";

interface VoiceCloneInputProps {
  refAudio: string | null;
  refText: string;
  onRefAudioChange: (base64: string | null) => void;
  onRefTextChange: (text: string) => void;
}

export function VoiceCloneInput({
  refAudio,
  refText,
  onRefAudioChange,
  onRefTextChange,
}: VoiceCloneInputProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-4">
      {/* Reference audio upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          Reference Audio
        </label>
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
          onClick={() => fileInputRef.current?.click()}
          className={`flex w-full items-center gap-3 rounded-lg border border-dashed p-4 transition-all ${
            refAudio
              ? "border-[var(--accent)] bg-[var(--accent)]/5"
              : "border-[var(--border)] hover:border-[var(--text-secondary)]"
          }`}
        >
          {refAudio ? (
            <FileAudio className="h-5 w-5 text-[var(--accent)]" />
          ) : (
            <Upload className="h-5 w-5 text-[var(--text-secondary)]" />
          )}
          <div className="text-left">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {fileName || "Click to upload audio"}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {refAudio ? "Audio uploaded" : "WAV, MP3, or FLAC"}
            </p>
          </div>
        </button>
      </div>

      {/* Reference text */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          Reference Transcript (optional)
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
    </div>
  );
}
