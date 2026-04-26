"use client";

import type { TTSMode } from "@/lib/types";
import { Mic, Palette, Users } from "lucide-react";

interface ModeSelectorProps {
  mode: TTSMode;
  onChange: (mode: TTSMode) => void;
}

const MODES: { id: TTSMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "speech",
    label: "Speech",
    description: "Use predefined voices",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "voice-design",
    label: "Voice Design",
    description: "Create a voice from description",
    icon: <Palette className="h-4 w-4" />,
  },
  {
    id: "voice-clone",
    label: "Voice Clone",
    description: "Clone from reference audio",
    icon: <Mic className="h-4 w-4" />,
  },
];

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
            mode === m.id
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]"
          }`}
        >
          {m.icon}
          <span className="text-xs font-medium">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
