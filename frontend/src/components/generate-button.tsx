"use client";

import { Play, Loader2 } from "lucide-react";

interface GenerateButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export function GenerateButton({
  onClick,
  isGenerating,
  disabled,
}: GenerateButtonProps) {
  const isDisabled = disabled || isGenerating;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-all ${
        isDisabled
          ? "cursor-not-allowed bg-[var(--accent)]/50 text-white/60"
          : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.98]"
      }`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Play className="h-5 w-5" />
          <span>Generate Speech</span>
        </>
      )}
    </button>
  );
}
