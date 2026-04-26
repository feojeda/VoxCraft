"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, History, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AudioPlayer } from "@/components/audio-player";
import { DownloadButtons } from "@/components/download-buttons";
import { ShareButton } from "@/components/share-button";
import type { HistoryItem } from "@/lib/types";

function StatusBadge({ status }: { status: string }) {
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

function HistoryCard({
  item,
  onDelete,
}: {
  item: HistoryItem;
  onDelete: (id: string) => void;
}) {
  const isCompleted = item.status === "completed";

  return (
    <div className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      {/* Delete button */}
      <button
        onClick={() => {
          if (
            confirm("Are you sure you want to delete this generation?")
          ) {
            onDelete(item.id);
          }
        }}
        className="absolute right-3 top-3 rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-400"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Text preview */}
      <p className="mb-2 line-clamp-2 pr-8 text-sm text-[var(--text-primary)]">
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
        <span className="text-xs text-[var(--text-secondary)]">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
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
          <div className="flex items-center justify-end gap-2 pt-2">
            <ShareButton jobId={item.id} />
          </div>
        </div>
      )}

      {/* Error message */}
      {item.status === "failed" && item.error_message && (
        <p className="mt-2 text-xs text-[var(--error)]">
          {item.error_message}
        </p>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["history", page],
    queryFn: () => apiClient.getHistory(page * limit, limit),
  });

  const deleteMutation = useMutation({
    mutationFn: (jobId: string) => apiClient.deleteHistoryItem(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = total > (page + 1) * limit;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <History className="h-5 w-5 text-[var(--accent)]" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Generation History
          </h1>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
            <span className="ml-2 text-sm text-[var(--text-secondary)]">
              Loading history...
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="text-sm text-[var(--error)]">
              Failed to load history. Please try again later.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && items.length === 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <History className="mx-auto mb-3 h-8 w-8 text-[var(--text-secondary)]" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No generations yet
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Your generated audio will appear here.
            </p>
          </div>
        )}

        {/* History list */}
        {!isLoading && !error && items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={deleteMutation.isPending}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-50"
                >
                  Load more
                </button>
              </div>
            )}

            {/* Pagination info */}
            <p className="text-center text-xs text-[var(--text-secondary)]">
              Showing {items.length} of {total} generations
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
