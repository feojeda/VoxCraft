"use client";

interface VoiceDesignInputProps {
  instructions: string;
  onChange: (instructions: string) => void;
}

export function VoiceDesignInput({ instructions, onChange }: VoiceDesignInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--text-primary)]">
        Voice Description
      </label>
      <p className="text-xs text-[var(--text-secondary)]">
        Describe the voice you want to create. Be specific about tone, accent, age, and style.
      </p>
      <textarea
        placeholder="e.g., A warm, friendly elderly British man with a slight rasp"
        value={instructions}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[80px] w-full resize-none rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        rows={3}
      />
    </div>
  );
}
