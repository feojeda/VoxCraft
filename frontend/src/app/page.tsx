"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { VoicePicker } from "@/components/voice-picker";
import { TextInput } from "@/components/text-input";
import { SpeedSlider } from "@/components/speed-slider";
import { GenerateButton } from "@/components/generate-button";
import { ProgressBar } from "@/components/progress-bar";
import { ErrorMessage } from "@/components/error-message";
import { AudioPlayer } from "@/components/audio-player";
import { DownloadButtons } from "@/components/download-buttons";
import { EmptyState } from "@/components/empty-state";
import { ModeSelector } from "@/components/mode-selector";
import { VoiceDesignInput } from "@/components/voice-design-input";
import { VoiceCloneInput } from "@/components/voice-clone-input";
import { useTTSGeneration } from "@/hooks/use-tts-generation";
import type { TTSMode } from "@/lib/types";

export default function Home() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<TTSMode>("speech");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [instructions, setInstructions] = useState("");
  const [refAudio, setRefAudio] = useState<string | null>(null);
  const [refText, setRefText] = useState("");
  const [textError, setTextError] = useState<string | undefined>(undefined);

  const {
    generate,
    status: generationStatus,
    progress,
    audioUrls,
    error: generationError,
    isGenerating,
  } = useTTSGeneration({
    text,
    mode,
    speaker: selectedSpeaker,
    speed,
    instructions,
    refAudio,
    refText,
  });

  const handleTextChange = (newText: string) => {
    setText(newText);
    // Clear error when user starts typing
    if (textError && newText.trim().length > 0) {
      setTextError(undefined);
    }
  };

  const handleGenerate = () => {
    // Validate text input (D-16: red outline on invalid)
    if (!text.trim()) {
      setTextError("Please enter some text");
      return;
    }
    setTextError(undefined);
    generate();
  };

  // Map generation status to JobStatus for ProgressBar
  const jobStatusForProgress =
    generationStatus === "creating"
      ? ("queued" as const)
      : generationStatus === "polling"
        ? ("processing" as const)
        : generationStatus === "completed"
          ? ("completed" as const)
          : generationStatus === "failed"
            ? ("failed" as const)
            : null;

  // Determine if generate button should be disabled based on mode
  const isGenerateDisabled = () => {
    if (!text.trim()) return true;
    if (mode === "speech" && !selectedSpeaker) return true;
    if (mode === "voice-design" && !instructions.trim()) return true;
    if (mode === "voice-clone" && !refAudio) return true;
    return false;
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-7 w-7 text-[var(--accent)]" />
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              ttsQwen
            </h1>
          </div>
          <p className="mt-2 text-[var(--text-secondary)]">
            Generate speech from text
          </p>
        </header>

        <div className="space-y-6">
          {/* Text Input Section */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Text Input
            </h2>
            <TextInput
              value={text}
              onChange={handleTextChange}
              error={textError}
            />
          </section>

          {/* Mode & Voice Section */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Mode & Voice
            </h2>

            {/* Mode selector */}
            <div className="mb-4">
              <ModeSelector mode={mode} onChange={setMode} />
            </div>

            {/* Mode-specific inputs */}
            {mode === "speech" && (
              <div className="mb-4">
                <VoicePicker
                  selectedSpeaker={selectedSpeaker}
                  onSelect={setSelectedSpeaker}
                />
              </div>
            )}

            {mode === "voice-design" && (
              <div className="mb-4">
                <VoiceDesignInput
                  instructions={instructions}
                  onChange={setInstructions}
                />
              </div>
            )}

            {mode === "voice-clone" && (
              <div className="mb-4">
                <VoiceCloneInput
                  refAudio={refAudio}
                  refText={refText}
                  onRefAudioChange={setRefAudio}
                  onRefTextChange={setRefText}
                />
              </div>
            )}

            {/* Speed slider (only for speech mode) */}
            {mode === "speech" && (
              <div className="mb-4">
                <SpeedSlider value={speed} onChange={setSpeed} />
              </div>
            )}

            {/* Generate button */}
            <GenerateButton
              onClick={handleGenerate}
              isGenerating={isGenerating}
              disabled={isGenerateDisabled()}
            />

            {/* Progress bar */}
            <ProgressBar
              status={jobStatusForProgress}
              progress={progress}
            />

            {/* Error message with retry */}
            <ErrorMessage message={generationError} onRetry={handleGenerate} />
          </section>

          {/* Audio Output Section */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Audio Output
            </h2>

            {/* Empty state — shown before first generation */}
            {!audioUrls && !isGenerating && <EmptyState />}

            {/* Audio player — shown during generation or when audio is ready */}
            {(audioUrls !== null || isGenerating) && (
              <AudioPlayer
                audioUrl={audioUrls?.wav ?? null}
                isGenerating={isGenerating}
              />
            )}

            {/* Download buttons — shown when audio is ready */}
            {audioUrls && (
              <DownloadButtons
                wavUrl={audioUrls.wav}
                mp3Url={audioUrls.mp3}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
