"use client";

import { useState } from "react";
import {
  Pencil,
  Check,
  Trash2,
  AlertTriangle,
  Loader2,
  Volume2,
} from "lucide-react";
import type { VoiceResponse } from "@/lib/types";

interface VoiceManagerProps {
  voices: VoiceResponse[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export function VoiceManager({
  voices,
  onRefresh,
  isLoading,
}: VoiceManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { apiClient } = require("@/lib/api-client");

  const startEdit = (voice: VoiceResponse) => {
    setEditingId(voice.id);
    setEditName(voice.name);
  };

  const saveEdit = async (voiceId: string) => {
    if (!editName.trim()) return;
    try {
      await apiClient.updateVoice(voiceId, editName.trim());
      setEditingId(null);
      onRefresh();
    } catch {
      // Error handled silently; user can retry
    }
  };

  const confirmDelete = async (voiceId: string) => {
    setIsDeleting(true);
    try {
      await apiClient.deleteVoice(voiceId);
      setDeletingId(null);
      onRefresh();
    } catch {
      // Error handled silently; user can retry
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div className="h-4 w-24 rounded bg-[var(--border)]" />
            <div className="mt-2 h-3 w-16 rounded bg-[var(--border)]" />
            <div className="mt-4 h-8 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    );
  }

  if (voices.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <Volume2 className="mx-auto h-8 w-8 text-[var(--text-secondary)]" />
        <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
          No cloned voices yet
        </p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Upload or record your first voice above.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {voices.map((voice) => (
        <div
          key={voice.id}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--text-secondary)]"
        >
          {/* Name / Edit */}
          <div className="flex items-center justify-between gap-2">
            {editingId === voice.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(voice.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  onClick={() => saveEdit(voice.id)}
                  className="rounded-md p-1 text-[var(--success)] hover:bg-[var(--surface-hover)]"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {voice.name}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(voice)}
                    className="rounded-md p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(voice.id)}
                    className="rounded-md p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--error)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Meta */}
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {voice.duration_seconds.toFixed(1)}s &bull; {voice.sample_rate}Hz
          </p>

          {/* Audio preview */}
          <div className="mt-3">
            <audio
              src={`/api/audio/voices/${voice.id}`}
              controls
              className="h-8 w-full"
              // Note: actual audio serving endpoint may differ; using placeholder path
            />
          </div>

          {/* Delete confirmation */}
          {deletingId === voice.id && (
            <div className="mt-3 rounded-md bg-[var(--error)]/10 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[var(--error)]" />
                <span className="text-xs font-medium text-[var(--error)]">
                  Delete this voice?
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => confirmDelete(voice.id)}
                  disabled={isDeleting}
                  className="rounded-md bg-[var(--error)] px-3 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="rounded-md border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
