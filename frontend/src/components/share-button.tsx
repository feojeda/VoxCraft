"use client";

import { useState, useCallback } from "react";
import { Share2, X, Loader2, Copy, Check } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { ShareLink } from "@/lib/types";

interface ShareButtonProps {
  jobId: string;
  className?: string;
}

export function ShareButton({ jobId, className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result: ShareLink = await apiClient.createShare(
        jobId,
        expiresAt || null
      );
      setShareUrl(result.share_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create share link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silently fail if clipboard API is unavailable
    }
  }, [shareUrl]);

  const handleClose = () => {
    setIsOpen(false);
    setShareUrl(null);
    setError(null);
    setExpiresAt("");
    setCopied(false);
  };

  // Compute expiration options
  const now = new Date();
  const days7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const days30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return (
    <>
      {/* Share icon button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] ${className ?? ""}`}
        aria-label="Share"
        title="Share"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Share Audio
              </h2>
              <button
                onClick={handleClose}
                className="rounded-md p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Share created — show URL */}
            {shareUrl ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  Your share link is ready:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Expiration selector */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                    Expires:
                  </label>
                  <select
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Never</option>
                    <option value={days7}>7 days</option>
                    <option value={days30}>30 days</option>
                  </select>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-[var(--error)]">{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isLoading}
                    className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      "Create Link"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
