"use client";

import { Smile, Frown, Flame, Meh, VolumeX } from "lucide-react";

interface EmotionSelectorProps {
  value: string | null;
  onSelect: (preset: string | null) => void;
}

const EMOTIONS = [
  { id: "happy", label: "Happy", icon: Smile },
  { id: "sad", label: "Sad", icon: Frown },
  { id: "angry", label: "Angry", icon: Flame },
  { id: "neutral", label: "Neutral", icon: Meh },
  { id: "whisper", label: "Whisper", icon: VolumeX },
];

export function EmotionSelector({ value, onSelect }: EmotionSelectorProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-[var(--text-secondary)]">
        Emotion
      </span>
      <div className="flex flex-wrap gap-2">
        {EMOTIONS.map((emotion) => {
          const isSelected = value === emotion.id;
          const Icon = emotion.icon;
          return (
            <button
              key={emotion.id}
              type="button"
              onClick={() =>
                onSelect(isSelected ? null : emotion.id)
              }
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {emotion.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
