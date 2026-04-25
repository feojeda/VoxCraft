"use client";

interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
  error?: string;
}

const MAX_LENGTH = 50000;

export function TextInput({ value, onChange, error }: TextInputProps) {
  const charCount = value.length;
  const wordCount = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;

  return (
    <div className="flex flex-col">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter the text you want to convert to speech..."
        maxLength={MAX_LENGTH}
        rows={8}
        className={`min-h-[200px] resize-none rounded-lg bg-[var(--background)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 ${
          error
            ? "border-2 border-[var(--error)] focus:ring-[var(--error)]"
            : "border border-[var(--border)] focus:ring-[var(--accent)]"
        } transition-colors`}
      />

      {/* Validation error */}
      {error && (
        <p className="mt-1.5 text-sm text-[var(--error)]">{error}</p>
      )}

      {/* Counters */}
      <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>{wordCount} word{wordCount !== 1 ? "s" : ""}</span>
        <span>
          {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}
