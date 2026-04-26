"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ProsodyInputProps {
  value: string;
  onChange: (value: string) => void;
}

const EXAMPLES = [
  "Speak slowly and clearly",
  "Whisper softly",
  "Sound excited and energetic",
  "Read like a documentary narrator",
];

const MAX_LENGTH = 200;

export function ProsodyInput({ value, onChange }: ProsodyInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        Prosody & Style
      </button>

      {isOpen && (
        <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          {/* Textarea */}
          <div className="space-y-1">
            <textarea
              value={value}
              onChange={(e) => {
                if (e.target.value.length <= MAX_LENGTH) {
                  onChange(e.target.value);
                }
              }}
              placeholder="e.g., Speak cheerfully, like you're telling exciting news"
              rows={3}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <div className="flex justify-end">
              <span
                className={`text-xs ${
                  value.length >= MAX_LENGTH
                    ? "text-[var(--error)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {value.length}/{MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-[var(--text-secondary)]">Examples:</span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onChange(example)}
                className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
