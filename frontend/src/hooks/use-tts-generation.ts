"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { JobStatus, JobStatusResponse } from "@/lib/types";

interface UseTTSGenerationReturn {
  generate: () => void;
  status: "idle" | "creating" | "polling" | "completed" | "failed";
  progress: number;
  audioUrls: { wav: string | null; mp3: string | null } | null;
  error: string | null;
  isGenerating: boolean;
}

interface UseTTSGenerationOptions {
  text: string;
  speaker: string | null;
  speed: number;
}

const POLL_INTERVAL = 2000; // 2 seconds

export function useTTSGeneration({
  text,
  speaker,
  speed,
}: UseTTSGenerationOptions): UseTTSGenerationReturn {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<UseTTSGenerationReturn["status"]>("idle");
  const [progress, setProgress] = useState(0);
  const [audioUrls, setAudioUrls] = useState<{
    wav: string | null;
    mp3: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track whether this generation is active to prevent stale updates
  const generationRef = useRef(0);

  // Job status polling — only active when jobId is set and status is creating/polling
  const { data: jobStatus } = useQuery<JobStatusResponse>({
    queryKey: ["job-status", jobId],
    queryFn: () => apiClient.getJobStatus(jobId!),
    enabled: jobId !== null && (status === "creating" || status === "polling"),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === "completed" || data.status === "failed")) {
        return false; // Stop polling
      }
      return POLL_INTERVAL;
    },
    refetchOnWindowFocus: false,
  });

  // Process polling results
  if (jobStatus) {
    const currentGeneration = generationRef.current;

    if (jobStatus.status === "completed" && status !== "completed") {
      setAudioUrls({
        wav: jobStatus.audio_wav_url,
        mp3: jobStatus.audio_mp3_url,
      });
      setProgress(100);
      setStatus("completed");
      setError(null);
    } else if (jobStatus.status === "failed" && status !== "failed") {
      setError(jobStatus.error_message || "Generation failed");
      setStatus("failed");
    } else if (
      (jobStatus.status === "processing" || jobStatus.status === "queued") &&
      status !== "completed" &&
      status !== "failed"
    ) {
      // Only update if still in this generation cycle
      if (currentGeneration === generationRef.current) {
        setProgress(jobStatus.progress);
        setStatus("polling");
      }
    }
  }

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: () =>
      apiClient.createTTSJob({
        text,
        speaker: speaker!,
        speed,
      }),
    onSuccess: (data) => {
      setJobId(data.job_id);
      setStatus("creating");
      setProgress(0);
      setAudioUrls(null);
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create job");
      setStatus("failed");
    },
  });

  const generate = useCallback(() => {
    // Validate input
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }
    if (!speaker) {
      setError("Please select a voice");
      return;
    }

    // Increment generation counter to invalidate stale polling
    generationRef.current += 1;

    // Reset state for new generation (D-14: each new generation replaces previous)
    setJobId(null);
    setStatus("creating");
    setProgress(0);
    setAudioUrls(null);
    setError(null);

    // Invalidate any previous job queries
    queryClient.removeQueries({ queryKey: ["job-status"] });

    createJobMutation.mutate();
  }, [text, speaker, speed, createJobMutation, queryClient]);

  const isGenerating =
    status === "creating" || status === "polling";

  return {
    generate,
    status,
    progress,
    audioUrls,
    error,
    isGenerating,
  };
}
