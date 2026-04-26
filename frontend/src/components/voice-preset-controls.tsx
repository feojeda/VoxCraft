"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2, ChevronDown } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { VoicePreset } from "@/lib/types";

interface VoicePresetControlsProps {
  currentSpeed: number;
  currentEmotion: string | null;
  currentInstruct: string;
  onLoadPreset: (preset: {
    speed: number;
    emotion_preset: string | null;
    instruct: string | null;
  }) => void;
}

export function VoicePresetControls({
  currentSpeed,
  currentEmotion,
  currentInstruct,
  onLoadPreset,
}: VoicePresetControlsProps) {
  const queryClient = useQueryClient();
  const [presetName, setPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data } = useQuery({
    queryKey: ["presets"],
    queryFn: () => apiClient.getPresets(),
  });

  const presets = data?.presets ?? [];

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      apiClient.createPreset({
        name,
        speed: currentSpeed,
        emotion_preset: currentEmotion,
        instruct: currentInstruct,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      setPresetName("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deletePreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      setSelectedPresetId("");
    },
  });

  const handleSave = () => {
    const name = presetName.trim();
    if (!name) return;
    createMutation.mutate(name);
  };

  const handleLoad = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      onLoadPreset(preset);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
        Voice Presets
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Save preset */}
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <button
            onClick={handleSave}
            disabled={!presetName.trim() || createMutation.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saveSuccess ? "Saved!" : "Save"}
          </button>
        </div>

        {/* Load preset */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedPresetId}
              onChange={(e) => handleLoad(e.target.value)}
              className="appearance-none rounded-md border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-3 pr-8 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">Load preset...</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
          </div>

          {selectedPresetId && (
            <button
              onClick={() => deleteMutation.mutate(selectedPresetId)}
              disabled={deleteMutation.isPending}
              className="rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-400"
              aria-label="Delete preset"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {presets.length === 0 && (
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          No saved presets yet.
        </p>
      )}
    </div>
  );
}
