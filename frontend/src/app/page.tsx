"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { VoicePicker } from "@/components/voice-picker";
import { TextInput } from "@/components/text-input";
import { SpeedSlider } from "@/components/speed-slider";

export default function Home() {
  const [text, setText] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [textError, setTextError] = useState<string | undefined>(undefined);

  const handleTextChange = (newText: string) => {
    setText(newText);
    // Clear error when user starts typing
    if (textError && newText.trim().length > 0) {
      setTextError(undefined);
    }
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

          {/* Voice & Settings Section */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Voice & Settings
            </h2>

            {/* Voice picker */}
            <div className="mb-4">
              <VoicePicker
                selectedSpeaker={selectedSpeaker}
                onSelect={setSelectedSpeaker}
              />
            </div>

            {/* Speed slider + Generate button row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <SpeedSlider value={speed} onChange={setSpeed} />
              </div>
              <div className="sm:w-48">
                {/* Generate button placeholder — wired in Task 2 */}
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-lg bg-[var(--accent)] px-6 py-3 text-center font-semibold text-white opacity-50"
                >
                  Generate Speech
                </button>
              </div>
            </div>
          </section>

          {/* Audio Output Section */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Audio Output
            </h2>
            <div className="min-h-[100px] rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-center text-[var(--text-secondary)]">
              Your audio will appear here
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
