"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Library } from "lucide-react";
import Link from "next/link";
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
import { EmotionSelector } from "@/components/EmotionSelector";
import { ProsodyInput } from "@/components/ProsodyInput";
import { PronunciationDict } from "@/components/PronunciationDict";
import { VoicePresetControls } from "@/components/voice-preset-controls";
import { useTTSGeneration } from "@/hooks/use-tts-generation";
import { apiClient } from "@/lib/api-client";
import type { TTSMode, VoiceResponse, PronunciationEntry } from "@/lib/types";

export default function Home() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<TTSMode>("speech");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [instructions, setInstructions] = useState("");
  const [refAudio, setRefAudio] = useState<string | null>(null);
  const [refText, setRefText] = useState("");
  const [textError, setTextError] = useState<string | undefined>(undefined);

  // Phase 2 prosody state
  const [emotionPreset, setEmotionPreset] = useState<string | null>(null);
  const [instruct, setInstruct] = useState("");
  const [pronunciationEnabled, setPronunciationEnabled] = useState(false);
  const [pronunciationEntries, setPronunciationEntries] = useState<
    PronunciationEntry[]
  >([]);

  // Cloned voices
  const [clonedVoices, setClonedVoices] = useState<VoiceResponse[]>([]);

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
    clonedVoiceId,
    speed,
    instructions,
    refAudio,
    refText,
    instruct,
    emotionPreset,
    pronunciationEnabled,
  });

  // Load cloned voices and pronunciation entries
  const loadData = useCallback(async () => {
    try {
      const voicesData = await apiClient.listVoices();
      setClonedVoices(voicesData.voices);
    } catch {
      // Silently fail — cloned voices are optional
    }
    try {
      const pronData = await apiClient.listPronunciationEntries();
      setPronunciationEntries(
        pronData.entries.map((e) => ({
          id: e.id,
          word: e.word,
          replacement: e.replacement,
        }))
      );
    } catch {
      // Silently fail — pronunciation is optional
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (textError && newText.trim().length > 0) {
      setTextError(undefined);
    }
  };

  const handleGenerate = () => {
    if (!text.trim()) {
      setTextError("Please enter some text");
      return;
    }
    setTextError(undefined);
    generate();
  };

  const handleLoadPreset = (preset: {
    speed: number;
    emotion_preset: string | null;
    instruct: string | null;
  }) => {
    setSpeed(preset.speed);
    setEmotionPreset(preset.emotion_preset);
    setInstruct(preset.instruct ?? "");
  };

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

  const isGenerateDisabled = () => {
    if (!text.trim()) return true;
    if (mode === "speech" && !selectedSpeaker && !clonedVoiceId) return true;
    if (mode === "voice-design" && !instructions.trim()) return true;
    if (mode === "voice-clone" && !refAudio) return true;
    return false;
  };

  // When mode changes, reset voice selections
  const handleModeChange = (newMode: TTSMode) => {
    setMode(newMode);
    setSelectedSpeaker(null);
    setClonedVoiceId(null);
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
          <Link
            href="/voices"
            className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
          >
            <Library className="h-4 w-4" />
            Voice Library →
          </Link>
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
              <ModeSelector mode={mode} onChange={handleModeChange} />
            </div>

            {/* Mode-specific inputs */}
            {mode === "speech" && (
              <div className="mb-4 space-y-4">
                {/* Predefined voices */}
                <VoicePicker
                  selectedSpeaker={selectedSpeaker}
                  onSelect={(id) => {
                    setSelectedSpeaker(id);
                    setClonedVoiceId(null);
                  }}
                />

                {/* Cloned voices */}
                <div>
                  <span className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                    My Voices
                  </span>
                  {clonedVoices.length === 0 ? (
                    <p className="text-xs text-[var(--text-secondary)]">
                      No cloned voices yet.{" "}
                      <Link
                        href="/voices"
                        className="text-[var(--accent)] hover:underline"
                      >
                        Create one in Voice Library →
                      </Link>
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {clonedVoices.map((voice) => {
                        const isSelected = clonedVoiceId === voice.id;
                        return (
                          <button
                            key={voice.id}
                            type="button"
                            onClick={() => {
                              setClonedVoiceId(
                                isSelected ? null : voice.id
                              );
                              setSelectedSpeaker(null);
                            }}
                            className={`rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                              isSelected
                                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                                : "border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                            }`}
                          >
                            <span className="font-medium">{voice.name}</span>
                            <span className="ml-1 text-xs text-[var(--text-secondary)]">
                              {voice.duration_seconds.toFixed(0)}s
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Speed slider */}
                <SpeedSlider value={speed} onChange={setSpeed} />

                {/* Emotion selector */}
                <EmotionSelector
                  value={emotionPreset}
                  onSelect={setEmotionPreset}
                />

                {/* Prosody input */}
                <ProsodyInput value={instruct} onChange={setInstruct} />

                {/* Pronunciation dictionary */}
                <PronunciationDict
                  enabled={pronunciationEnabled}
                  onToggle={setPronunciationEnabled}
                  entries={pronunciationEntries}
                  onEntriesChange={setPronunciationEntries}
                />

                {/* Voice presets */}
                <VoicePresetControls
                  currentSpeed={speed}
                  currentEmotion={emotionPreset}
                  currentInstruct={instruct}
                  onLoadPreset={handleLoadPreset}
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

            {!audioUrls && !isGenerating && <EmptyState />}

            {(audioUrls !== null || isGenerating) && (
              <AudioPlayer
                audioUrl={audioUrls?.wav ?? null}
                isGenerating={isGenerating}
              />
            )}

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
