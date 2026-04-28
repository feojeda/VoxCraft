"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Download,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AudioPlayer } from "@/components/audio-player";
import { DownloadButtons } from "@/components/download-buttons";
import type { JobStatus, BatchItem } from "@/lib/types";

function StatusBadge({ status }: { status: JobStatus }) {
  const styles: Record<string, string> = {
    completed: "bg-green-500/10 text-green-400",
    failed: "bg-red-500/10 text-red-400",
    processing: "bg-yellow-500/10 text-yellow-400",
    queued: "bg-gray-500/10 text-gray-400",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] || styles.queued
      }`}
    >
      {status}
    </span>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}

function BatchItemCard({ item }: { item: BatchItem }) {
  const isCompleted = item.status === "completed";
  const isFailed = item.status === "failed";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      {/* Text preview */}
      <p className="mb-2 line-clamp-2 text-sm text-[var(--text-primary)]">
        {item.text}
      </p>

      {/* Meta row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {item.voice_name && (
          <span className="inline-flex rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs text-[var(--accent)]">
            {item.voice_name}
          </span>
        )}
        <StatusBadge status={item.status} />
      </div>

      {/* Audio player and downloads for completed jobs */}
      {isCompleted && (
        <div className="space-y-3">
          {item.audio_wav_url && (
            <AudioPlayer
              audioUrl={item.audio_wav_url}
              isGenerating={false}
            />
          )}
          <DownloadButtons
            wavUrl={item.audio_wav_url}
            mp3Url={item.audio_mp3_url}
          />
        </div>
      )}

      {/* Error message */}
      {isFailed && item.error_message && (
        <p className="mt-2 text-xs text-[var(--error)]">
          {item.error_message}
        </p>
      )}
    </div>
  );
}

function BatchItemTable({ items }: { items: BatchItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Text</th>
            <th className="px-4 py-3 font-medium">Voice</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item, index) => (
            <tr key={item.job_id} className="hover:bg-[var(--surface-hover)]">
              <td className="px-4 py-3 text-[var(--text-secondary)]">
                {index + 1}
              </td>
              <td className="px-4 py-3 max-w-xs">
                <p className="truncate text-[var(--text-primary)]">
                  {item.text.length > 60
                    ? `${item.text.slice(0, 60)}...`
                    : item.text}
                </p>
              </td>
              <td className="px-4 py-3">
                {item.voice_name ? (
                  <span className="inline-flex rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs text-[var(--accent)]">
                    {item.voice_name}
                  </span>
                ) : (
                  <span className="text-[var(--text-secondary)]">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3">
                {item.error_message ? (
                  <span className="text-xs text-[var(--error)]">
                    {item.error_message}
                  </span>
                ) : (
                  <span className="text-[var(--text-secondary)]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.batchId as string;
  const [zipFormat, setZipFormat] = useState<"mp3" | "both">("mp3");
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: batch,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => apiClient.getBatch(batchId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") {
        return false;
      }
      return 3000; // 3 seconds
    },
    refetchOnWindowFocus: false,
  });

  const handleDownloadZip = useCallback(async () => {
    setIsDownloading(true);
    try {
      const blob = await apiClient.downloadBatchZip(batchId, zipFormat);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch_${batchId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP download failed:", err);
      alert("Failed to download ZIP. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [batchId, zipFormat]);

  const items = batch?.items ?? [];
  const isCompleted = batch?.status === "completed";
  const isProcessing = batch?.status === "processing" || batch?.status === "queued";
  const isDone = batch?.status === "completed" || batch?.status === "failed";
  const progressPercent = batch && batch.total_items > 0
    ? Math.round((batch.completed_count / batch.total_items) * 100)
    : 0;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <Link
          href="/batches"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to batches
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Batch {batchId.slice(0, 12)}...
          </h1>
          {batch && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Created {new Date(batch.created_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
            <span className="ml-2 text-sm text-[var(--text-secondary)]">
              Loading batch...
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="text-sm text-[var(--error)]">
              Failed to load batch. Please try again later.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {/* Batch content */}
        {batch && (
          <div className="space-y-6">
            {/* Progress section */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={batch.status} />
                  <span className="text-sm text-[var(--text-primary)]">
                    {batch.completed_count} of {batch.total_items} completed
                  </span>
                </div>
                {batch.failed_count > 0 && (
                  <span className="text-xs text-[var(--error)]">
                    {batch.failed_count} failed
                  </span>
                )}
              </div>
              <ProgressBar progress={progressPercent} />

              {/* ZIP download */}
              {isDone && batch?.completed_count > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
                  <select
                    value={zipFormat}
                    onChange={(e) =>
                      setZipFormat(e.target.value as "mp3" | "both")
                    }
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="mp3">MP3 only</option>
                    <option value="both">MP3 + WAV</option>
                  </select>
                  <button
                    onClick={handleDownloadZip}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isDownloading ? "Downloading..." : "Download ZIP"}
                  </button>
                </div>
              )}
            </div>

            {/* Items display */}
            {items.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-medium text-[var(--text-primary)]">
                  Items ({items.length})
                </h2>
                {isProcessing ? (
                  <BatchItemTable items={items} />
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <BatchItemCard key={item.job_id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No items */}
            {items.length === 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  No items in this batch.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
