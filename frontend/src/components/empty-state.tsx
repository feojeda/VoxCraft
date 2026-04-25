"use client";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {/* Subtle waveform SVG placeholder */}
      <svg
        viewBox="0 0 200 40"
        className="mb-4 h-10 w-48 opacity-30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stylized waveform bars */}
        <rect x="2" y="12" width="3" height="16" rx="1.5" fill="currentColor" />
        <rect x="10" y="6" width="3" height="28" rx="1.5" fill="currentColor" />
        <rect x="18" y="10" width="3" height="20" rx="1.5" fill="currentColor" />
        <rect x="26" y="4" width="3" height="32" rx="1.5" fill="currentColor" />
        <rect x="34" y="8" width="3" height="24" rx="1.5" fill="currentColor" />
        <rect x="42" y="14" width="3" height="12" rx="1.5" fill="currentColor" />
        <rect x="50" y="6" width="3" height="28" rx="1.5" fill="currentColor" />
        <rect x="58" y="10" width="3" height="20" rx="1.5" fill="currentColor" />
        <rect x="66" y="2" width="3" height="36" rx="1.5" fill="currentColor" />
        <rect x="74" y="8" width="3" height="24" rx="1.5" fill="currentColor" />
        <rect x="82" y="12" width="3" height="16" rx="1.5" fill="currentColor" />
        <rect x="90" y="4" width="3" height="32" rx="1.5" fill="currentColor" />
        <rect x="98" y="10" width="3" height="20" rx="1.5" fill="currentColor" />
        <rect x="106" y="6" width="3" height="28" rx="1.5" fill="currentColor" />
        <rect x="114" y="14" width="3" height="12" rx="1.5" fill="currentColor" />
        <rect x="122" y="8" width="3" height="24" rx="1.5" fill="currentColor" />
        <rect x="130" y="12" width="3" height="16" rx="1.5" fill="currentColor" />
        <rect x="138" y="4" width="3" height="32" rx="1.5" fill="currentColor" />
        <rect x="146" y="10" width="3" height="20" rx="1.5" fill="currentColor" />
        <rect x="154" y="6" width="3" height="28" rx="1.5" fill="currentColor" />
        <rect x="162" y="14" width="3" height="12" rx="1.5" fill="currentColor" />
        <rect x="170" y="8" width="3" height="24" rx="1.5" fill="currentColor" />
        <rect x="178" y="12" width="3" height="16" rx="1.5" fill="currentColor" />
        <rect x="186" y="6" width="3" height="28" rx="1.5" fill="currentColor" />
        <rect x="194" y="10" width="3" height="20" rx="1.5" fill="currentColor" />
      </svg>
      <p className="text-sm font-medium text-[var(--text-secondary)]">
        Your audio will appear here
      </p>
      <p className="mt-1 text-xs text-[var(--text-secondary)] opacity-60">
        Enter text and click Generate to create speech
      </p>
    </div>
  );
}
