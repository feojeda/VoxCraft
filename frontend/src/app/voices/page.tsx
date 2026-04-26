"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Library, Upload, Mic } from "lucide-react";
import Link from "next/link";
import { VoiceUploader } from "@/components/VoiceUploader";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { VoiceManager } from "@/components/VoiceManager";
import { apiClient } from "@/lib/api-client";
import type { VoiceResponse } from "@/lib/types";

type Tab = "upload" | "record";

export default function VoicesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [voices, setVoices] = useState<VoiceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.listVoices();
      setVoices(data.voices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load voices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  const handleUploadComplete = (voice: VoiceResponse) => {
    setVoices((prev) => [voice, ...prev]);
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Generator
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <Library className="h-7 w-7 text-[var(--accent)]" />
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Voice Library
            </h1>
          </div>
          <p className="mt-2 text-[var(--text-secondary)]">
            Upload or record audio to create cloned voices for text-to-speech.
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === "upload"
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload Audio
          </button>
          <button
            onClick={() => setActiveTab("record")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === "record"
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <Mic className="h-4 w-4" />
            Record Audio
          </button>
        </div>

        {/* Tab content */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          {activeTab === "upload" ? (
            <VoiceUploader onUploadComplete={handleUploadComplete} />
          ) : (
            <VoiceRecorder onRecordComplete={handleUploadComplete} />
          )}
        </section>

        {/* Voice list */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            Your Voices
          </h2>
          {error && (
            <div className="mb-4 rounded-md bg-[var(--error)]/10 px-3 py-2 text-sm text-[var(--error)]">
              {error}
              <button
                onClick={loadVoices}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
          <VoiceManager
            voices={voices}
            onRefresh={loadVoices}
            isLoading={isLoading}
          />
        </section>
      </div>
    </main>
  );
}
