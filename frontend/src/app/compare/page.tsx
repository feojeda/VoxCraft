"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitCompare, Play, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type {
  CompareVoiceConfig,
  CompareResponse,
  CompareJobItem,
  VoiceResponse,
  Speaker,
} from "@/lib/types";
import { PREDEFINED_SPEAKERS } from "@/lib/types";

const POLL_INTERVAL = 2000;

function useVoiceCompare() {
  const [batchId, setBatchId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationRef = useRef(0);

  const { data: compareData } = useQuery<CompareResponse>({
    queryKey: ["compare", batchId],
    queryFn: () => apiClient.getCompare(batchId!),
    enabled: batchId !== null,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (
        data &&
        data.status !== "processing" &&
        data.status !== "queued"
      ) {
        return false;
      }
      return POLL_INTERVAL;
    },
    refetchOnWindowFocus: false,
  });

  const submit = useCallback(
    async (text: string, voices: CompareVoiceConfig[]) => {
      generationRef.current += 1;
      setBatchId(null);
      setError(null);
      setIsSubmitting(true);
      try {
        const result = await apiClient.createCompare(text, voices);
        setBatchId(result.batch_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create comparison");
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    submit,
    batchId,
    compareData,
    isSubmitting,
    error,
  };
}

export default function ComparePage() {
  const [text, setText] = useState("");
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(new Set());
  const [selectedCloned, setSelectedCloned] = useState<Set<string>>(new Set());
  const [clonedVoices, setClonedVoices] = useState<VoiceResponse[]>([]);
  const [predefinedSpeakers, setPredefinedSpeakers] = useState<Speaker[]>(PREDEFINED_SPEAKERS);

  const { submit, compareData, isSubmitting, error } = useVoiceCompare();

  useEffect(() => {
    apiClient.getSpeakers().then((data) => setPredefinedSpeakers(data.speakers)).catch(() => {});
    apiClient.listVoices().then((data) => setClonedVoices(data.voices)).catch(() => {});
  }, []);

  const toggleSpeaker = (id: string) => {
    setSelectedSpeakers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCloned = (id: string) => {
    setSelectedCloned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCompare = () => {
    if (!text.trim()) return;
    const voices: CompareVoiceConfig[] = [];
    selectedSpeakers.forEach((id) =>
      voices.push({ mode: "speech", speaker: id })
    );
    selectedCloned.forEach((id) =>
      voices.push({ mode: "voice-clone", cloned_voice_id: id })
    );
    if (voices.length < 2) {
      return;
    }
    submit(text, voices);
  };

  const totalSelected = selectedSpeakers.size + selectedCloned.size;
  const canCompare = text.trim().length > 0 && totalSelected >= 2;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2">
            <GitCompare className="h-7 w-7 text-[var(--accent)]" />
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Voice Compare
            </h1>
          </div>
          <p className="mt-2 text-[var(--text-secondary)]">
            Hear the same text spoken by different voices side by side.
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
          >
            ← Back to Generator
          </Link>
        </header>

        <div className="space-y-8">
          {/* Text input */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Text to Compare
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the text you want to hear in different voices..."
              rows={4}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </section>

          {/* Voice selection */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Select Voices ({totalSelected} selected)
            </h2>
            <p className="mb-4 text-xs text-[var(--text-secondary)]">
              Choose at least 2 voices to compare. You can mix predefined speakers and your cloned voices.
            </p>

            {/* Predefined speakers */}
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                Predefined Speakers
              </h3>
              <div className="flex flex-wrap gap-2">
                {predefinedSpeakers.map((speaker) => {
                  const isSelected = selectedSpeakers.has(speaker.id);
                  return (
                    <label
                      key={speaker.id}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-all ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => toggleSpeaker(speaker.id)}
                      />
                      <span className="font-medium">{speaker.name}</span>
                      <span className="ml-1 text-xs text-[var(--text-secondary)]">
                        {speaker.language} · {speaker.gender}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Cloned voices */}
            {clonedVoices.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                  My Cloned Voices
                </h3>
                <div className="flex flex-wrap gap-2">
                  {clonedVoices.map((voice) => {
                    const isSelected = selectedCloned.has(voice.id);
                    return (
                      <label
                        key={voice.id}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-all ${
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                            : "border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => toggleCloned(voice.id)}
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{voice.name}</span>
                          {voice.x_vector_only_mode && (
                            <span className="inline-flex items-center rounded-full bg-[var(--accent)]/20 px-1.5 py-0 text-[10px] font-medium text-[var(--accent)]">
                              T
                            </span>
                          )}
                        </div>
                        <span className="block text-xs text-[var(--text-secondary)]">
                          {voice.duration_seconds.toFixed(0)}s
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Compare button */}
          <div className="flex justify-center">
            <button
              onClick={handleCompare}
              disabled={!canCompare || isSubmitting}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all ${
                canCompare && !isSubmitting
                  ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                  : "cursor-not-allowed bg-[var(--surface-hover)] text-[var(--text-secondary)]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating comparison...
                </>
              ) : (
                <>
                  <GitCompare className="h-4 w-4" />
                  Compare Voices
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-[var(--error)]/10 px-3 py-2 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          {/* Results grid */}
          {compareData && compareData.jobs.length > 0 && (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Results
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {compareData.jobs.map((job) => (
                  <CompareCard key={job.job_id} job={job} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function CompareCard({ job }: { job: CompareJobItem }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {job.voice_name}
        </h3>
        <StatusBadge status={job.status} />
      </div>

      {/* Progress */}
      {job.status === "queued" || job.status === "processing" ? (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {job.progress}%
          </p>
        </div>
      ) : null}

      {/* Audio player */}
      {job.status === "completed" && (job.audio_mp3_url || job.audio_wav_url) ? (
        <div className="mt-3">
          <audio src={job.audio_mp3_url ?? job.audio_wav_url ?? undefined} controls className="w-full" />
        </div>
      ) : null}

      {/* Error */}
      {job.status === "failed" && job.error_message ? (
        <div className="mt-3 flex items-start gap-1.5 text-xs text-[var(--error)]">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {job.error_message}
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    queued: "bg-[var(--surface-hover)] text-[var(--text-secondary)]",
    processing: "bg-[var(--accent)]/10 text-[var(--accent)]",
    completed: "bg-[var(--success)]/10 text-[var(--success)]",
    failed: "bg-[var(--error)]/10 text-[var(--error)]",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${styles[status] || styles.queued}`}
    >
      {status}
    </span>
  );
}
