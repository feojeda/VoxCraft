"use client";

interface SpeedSliderProps {
  value: number;
  onChange: (speed: number) => void;
}

export function SpeedSlider({ value, onChange }: SpeedSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Label + current value */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Speed
        </label>
        <span className="text-sm font-semibold tabular-nums text-[var(--accent)]">
          {value.toFixed(1)}x
        </span>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={0.5}
          max={2.0}
          step={0.1}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="speed-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--border)]"
          aria-label="Speech speed"
        />
      </div>

      {/* Markers */}
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>0.5x</span>
        <span
          className={
            value === 1.0
              ? "font-semibold text-[var(--accent)]"
              : ""
          }
        >
          1.0x Normal
        </span>
        <span>2.0x</span>
      </div>

      {/* Custom slider styling */}
      <style jsx>{`
        .speed-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid var(--background);
          box-shadow: 0 0 4px rgba(124, 91, 245, 0.4);
        }
        .speed-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid var(--background);
          box-shadow: 0 0 4px rgba(124, 91, 245, 0.4);
        }
      `}</style>
    </div>
  );
}
