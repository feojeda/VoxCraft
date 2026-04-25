"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import type WaveSurfer from "wavesurfer.js";

interface AudioPlayerProps {
  audioUrl: string | null;
  isGenerating: boolean;
}

export function AudioPlayer({ audioUrl, isGenerating }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    let ws: WaveSurfer | null = null;

    import("wavesurfer.js").then(({ default: WaveSurfer }) => {
      if (!containerRef.current) return;

      ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "#3a3650",
        progressColor: "#6B65A0",
        cursorColor: "#7c5bf5",
        height: 80,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        backend: "WebAudio",
        normalize: true,
      });

      ws.on("ready", () => {
        setDuration(ws!.getDuration());
        setIsReady(true);
      });

      ws.on("audioprocess", () => {
        setCurrentTime(ws!.getCurrentTime());
      });

      ws.on("play", () => {
        setIsPlaying(true);
      });

      ws.on("pause", () => {
        setIsPlaying(false);
      });

      ws.on("finish", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      wavesurferRef.current = ws;
    });

    return () => {
      if (ws) {
        ws.destroy();
        wavesurferRef.current = null;
      }
    };
  }, []);

  // Load audio when URL changes
  useEffect(() => {
    if (audioUrl && wavesurferRef.current) {
      setIsReady(false);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      wavesurferRef.current.load(audioUrl);
    }
  }, [audioUrl]);

  const togglePlayPause = useCallback(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.playPause();
    }
  }, [isReady]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading shimmer state while generating and no audio yet
  if (isGenerating && !audioUrl) {
    return (
      <div className="rounded-lg bg-[var(--surface)] p-4">
        <div className="flex items-center justify-center gap-3 py-6">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
          <span className="text-sm text-[var(--text-secondary)]">
            Preparing audio...
          </span>
        </div>
        {/* Shimmer waveform placeholder */}
        <div className="flex items-end justify-center gap-[3px] h-[80px] overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="w-[2px] rounded-full bg-[var(--accent)] opacity-30 animate-pulse"
              style={{
                height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 15}%`,
                animationDelay: `${i * 50}ms`,
                animationDuration: "1.5s",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="rounded-lg bg-[var(--surface)] p-4">
      {/* Waveform container */}
      <div
        ref={containerRef}
        className="mb-3 min-h-[80px] rounded-md overflow-hidden"
        style={{ background: "var(--surface)" }}
      />

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={togglePlayPause}
          disabled={!isReady}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {!isReady ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        {/* Time display */}
        <div className="text-xs tabular-nums text-[var(--text-secondary)]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
