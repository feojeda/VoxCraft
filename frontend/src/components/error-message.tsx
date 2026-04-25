"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorMessageProps {
  message: string | null;
  onRetry: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="mt-3 flex items-start gap-3 rounded-lg border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3">
      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--error)]" />
      <div className="flex-1">
        <p className="text-sm text-[var(--error)]">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-md bg-[var(--error)]/20 px-3 py-1 text-xs font-medium text-[var(--error)] transition-colors hover:bg-[var(--error)]/30"
      >
        <RotateCcw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
}
