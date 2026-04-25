"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { PREDEFINED_SPEAKERS } from "@/lib/types";

interface VoicePickerProps {
  selectedSpeaker: string | null;
  onSelect: (id: string) => void;
}

export function VoicePicker({
  selectedSpeaker,
  onSelect,
}: VoicePickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 320;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
    // Update buttons after scroll settles
    setTimeout(updateScrollButtons, 350);
  };

  return (
    <div className="relative">
      {/* Section label */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          Select a Voice
        </span>
        <span className="text-xs text-[var(--text-secondary)]">
          {PREDEFINED_SPEAKERS.length} voices available
        </span>
      </div>

      {/* Scroll container with arrow buttons */}
      <div className="group relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[var(--surface)] p-1.5 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--surface-hover)]"
            aria-label="Scroll voices left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Card row */}
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-thin"
          style={{ scrollbarWidth: "none" }}
        >
          {PREDEFINED_SPEAKERS.map((speaker) => {
            const isSelected = selectedSpeaker === speaker.id;
            return (
              <button
                key={speaker.id}
                type="button"
                onClick={() => onSelect(speaker.id)}
                className={`flex w-[140px] flex-shrink-0 snap-start flex-col rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? "border-[var(--accent)] ring-2 ring-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {/* Voice name */}
                <span
                  className={`text-sm font-semibold capitalize ${
                    isSelected ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                  }`}
                >
                  {speaker.name}
                </span>

                {/* Language + gender tag */}
                <span className="mt-1 text-xs text-[var(--text-secondary)]">
                  {speaker.language} &bull; {speaker.gender}
                </span>

                {/* Description */}
                <span className="mt-1.5 line-clamp-2 text-xs text-[var(--text-secondary)] opacity-75">
                  {speaker.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[var(--surface)] p-1.5 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--surface-hover)]"
            aria-label="Scroll voices right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
