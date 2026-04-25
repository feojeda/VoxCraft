"use client";

import type { JobStatus } from "@/lib/types";

interface ProgressBarProps {
  status: JobStatus | null;
  progress: number;
}

export function ProgressBar({ status, progress }: ProgressBarProps) {
  // Don't show for completed or failed (other components handle those)
  if (!status || status === "completed" || status === "failed") {
    return null;
  }

  const isQueued = status === "queued";
  const isProcessing = status === "processing";

  return (
    <div className="mt-3">
      {/* Status label */}
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-[var(--text-secondary)]">
          {isQueued ? "Queued..." : `Processing... ${Math.round(progress)}%`}
        </span>
        {isProcessing && (
          <span className="tabular-nums text-[var(--accent)]">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
        {isQueued ? (
          // Pulsing indeterminate bar
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--accent)]" />
        ) : (
          // Determinate filling bar with smooth transition
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        )}
      </div>
    </div>
  );
}
