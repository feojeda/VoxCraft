"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { PronunciationEntry } from "@/lib/types";

interface PronunciationDictProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  entries: PronunciationEntry[];
  onEntriesChange: (entries: PronunciationEntry[]) => void;
}

export function PronunciationDict({
  enabled,
  onToggle,
  entries,
  onEntriesChange,
}: PronunciationDictProps) {
  const [word, setWord] = useState("");
  const [replacement, setReplacement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    const w = word.trim();
    const r = replacement.trim();

    if (!w || !r) {
      setError("Both word and replacement are required");
      return;
    }
    if (w.length > 100 || r.length > 100) {
      setError("Maximum 100 characters each");
      return;
    }
    if (entries.some((e) => e.word.toLowerCase() === w.toLowerCase())) {
      setError(`"${w}" already exists in the dictionary`);
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const entry = await apiClient.createPronunciationEntry(w, r);
      onEntriesChange([...entries, { id: entry.id, word: entry.word, replacement: entry.replacement }]);
      setWord("");
      setReplacement("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await apiClient.deletePronunciationEntry(entryId);
      onEntriesChange(entries.filter((e) => e.id !== entryId));
    } catch {
      // Silent fail — user can retry
    }
  };

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          Pronunciation Dictionary
        </span>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            enabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          {/* Input row */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Word"
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Replacement"
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              onClick={handleAdd}
              disabled={isAdding}
              className="flex items-center justify-center gap-1 rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-2 text-xs text-[var(--error)]">{error}</div>
          )}

          {/* Entries list */}
          <div className="mt-3 space-y-1">
            {entries.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">
                No pronunciation overrides defined yet.
              </p>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md bg-[var(--background)] px-3 py-1.5"
                >
                  <span className="text-sm text-[var(--text-primary)]">
                    <span className="font-medium">{entry.word}</span>
                    <span className="mx-1 text-[var(--text-secondary)]">→</span>
                    <span className="text-[var(--text-secondary)]">
                      {entry.replacement}
                    </span>
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="rounded p-0.5 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--error)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
