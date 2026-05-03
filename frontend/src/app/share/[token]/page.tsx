"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AudioPlayer } from "@/components/audio-player";
import type { SharePublicData } from "@/lib/types";

type ShareState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: SharePublicData };

export default function SharePage() {
  const params = useParams();
  const token = (params?.token as string) ?? "";
  const [state, setState] = useState<ShareState>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "Invalid share link." });
      return;
    }

    apiClient
      .getPublicShare(token)
      .then((data) => setState({ status: "success", data }))
      .catch(() =>
        setState({
          status: "error",
          message: "Share link not found or expired.",
        })
      );
  }, [token]);

  // Loading state
  if (state.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
          <span className="text-sm text-[var(--text-secondary)]">
            Loading share...
          </span>
        </div>
      </main>
    );
  }

  // Error state
  if (state.status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="mx-auto max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">
                 VoxCraft
            </span>
          </Link>
          <h1 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
            {state.message}
          </h1>
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            The link may have expired or been revoked by its owner.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90"
          >
            Go to homepage
          </Link>
        </div>
      </main>
    );
  }

  // Success state
  const { data } = state;
  const audioUrl = data.audio_wav_url || data.audio_mp3_url;

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg">
        {/* Card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          {/* Header / Branding */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                VoxCraft
              </span>
            </Link>
          </div>

          {/* Audio player */}
          {audioUrl && (
            <div className="mb-6">
              <AudioPlayer audioUrl={audioUrl} isGenerating={false} />
            </div>
          )}

          {/* Source text */}
          <div className="mb-4">
            <h2 className="mb-1 text-sm font-medium text-[var(--text-secondary)]">
              Text
            </h2>
            <p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
              {data.text}
            </p>
          </div>

          {/* Voice name */}
          {data.voice_name && (
            <div className="mb-4">
              <span className="inline-flex rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs text-[var(--accent)]">
                {data.voice_name}
              </span>
            </div>
          )}

          {/* Metadata */}
          <p className="mb-6 text-xs text-[var(--text-secondary)]">
            Shared on {new Date(data.created_at).toLocaleDateString()}
          </p>

          {/* CTA */}
          <div className="border-t border-[var(--border)] pt-6 text-center">
            <Link
              href="/"
              className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90"
            >
              Generate your own
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
