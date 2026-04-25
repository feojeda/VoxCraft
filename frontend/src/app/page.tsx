import { Sparkles } from "lucide-react";

export default function Home() {
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
            {/* Text input area here */}
            <div className="min-h-[120px] rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-[var(--text-secondary)]">
              Text input area here
            </div>
          </section>

          {/* Voice & Settings Section */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Voice & Settings
            </h2>
            {/* Voice picker + speed slider here */}
            <div className="min-h-[80px] rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-[var(--text-secondary)]">
              Voice picker + speed slider here
            </div>
          </section>

          {/* Audio Output Section */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Audio Output
            </h2>
            {/* Audio player + downloads here */}
            <div className="min-h-[100px] rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-center text-[var(--text-secondary)]">
              Audio player + downloads here
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
