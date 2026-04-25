"use client";

import { Download } from "lucide-react";

interface DownloadButtonsProps {
  wavUrl: string | null;
  mp3Url: string | null;
}

export function DownloadButtons({ wavUrl, mp3Url }: DownloadButtonsProps) {
  if (!wavUrl && !mp3Url) {
    return null;
  }

  return (
    <div className="mt-3 flex gap-3">
      {mp3Url && (
        <a
          href={mp3Url}
          download
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] hover:border-[var(--text-secondary)]"
        >
          <Download className="h-4 w-4" />
          Download MP3
        </a>
      )}
      {wavUrl && (
        <a
          href={wavUrl}
          download
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] hover:border-[var(--text-secondary)]"
        >
          <Download className="h-4 w-4" />
          Download WAV
        </a>
      )}
    </div>
  );
}
