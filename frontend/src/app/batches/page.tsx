"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Upload, Loader2, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { BatchUpload } from "@/components/batch-upload";
import type { JobStatus } from "@/lib/types";

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

export default function BatchesPage() {
  const router = useRouter();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["batches"],
    queryFn: () => apiClient.getBatches(),
  });

  const items = data?.items ?? [];

  const handleUploadComplete = (batchId: string) => {
    router.push(`/batches/${batchId}`);
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <Upload className="h-5 w-5 text-[var(--accent)]" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Batches
          </h1>
        </div>

        {/* Upload section */}
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-4 text-sm font-medium text-[var(--text-primary)]">
            New Batch Upload
          </h2>
          <BatchUpload onUploadComplete={handleUploadComplete} />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
            <span className="ml-2 text-sm text-[var(--text-secondary)]">
              Loading batches...
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="text-sm text-[var(--error)]">
              Failed to load batches. Please try again later.
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

        {/* Empty state */}
        {!isLoading && !error && items.length === 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <Upload className="mx-auto mb-3 h-8 w-8 text-[var(--text-secondary)]" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No batches yet
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Upload a CSV file above to start processing multiple texts at once.
            </p>
          </div>
        )}

        {/* Batch list */}
        {!isLoading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((batch) => (
              <button
                key={batch.id}
                onClick={() => router.push(`/batches/${batch.id}`)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={batch.status} />
                    <span className="text-xs text-[var(--text-secondary)]">
                      {batch.completed_count} of {batch.total_items} completed
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-sm font-mono text-[var(--text-primary)]">
                  {batch.id.slice(0, 12)}...
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
