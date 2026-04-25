# Phase 1: Core TTS Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 1-core-tts-pipeline
**Areas discussed:** App Layout & Entry Point, Voice Picker, Generation Flow UX, Audio Player & Downloads, Error Handling, Generate Button Behavior, Empty/Initial State, Text Input, Infrastructure

---

## App Layout & Entry Point

| Option | Description | Selected |
|--------|-------------|----------|
| Single-page tool | Text, voice picker, settings, and audio player all on one screen | ✓ |
| Multi-step wizard | Step-by-step guided flow (text → voice → output) | |
| Split-panel workspace | Left: editor. Right: results. DAW/IDE style | |

| Option | Description | Selected |
|--------|-------------|----------|
| Clean & minimal | Dark theme, centered, whitespace. Linear/Vercel feel | ✓ |
| Functional & dense | Light background, many controls visible | |
| Card-based & colorful | Sections as cards, playful icons | |

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical stack | Text → voice/settings → audio. Top-to-bottom flow | ✓ |
| Two-column | Text left, controls/output right | |

**User's choice:** Single-page tool, clean & minimal (dark), vertical stack
**Notes:** Must be responsive — compatible with both mobile and desktop

---

## Voice Picker

| Option | Description | Selected |
|--------|-------------|----------|
| Card row with previews | Horizontal scrollable cards, each with name + play button | ✓ |
| Dropdown select | Simple select element with voice names | |
| Grid with details | 3x3 grid of voice cards with descriptions | |

| Option | Description | Selected |
|--------|-------------|----------|
| Name + tag | Voice name + language/gender (e.g., "Serena — EN Female") | ✓ |
| Name only | Just the voice name | |
| Name + description | Name + short voice character description | |

**User's choice:** Horizontal card row with name + tag
**Notes:** User asked about Qwen3-TTS version details and Spanish support — clarified 3 model variants and confirmed Spanish is supported

---

## Generation Flow UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline progress | Progress bar below Generate button, auto-updates | ✓ |
| Silent wait with reveal | Placeholder fills in when done | |
| Separate status page | Navigate to job detail page | |

| Option | Description | Selected |
|--------|-------------|----------|
| Slider | Continuous slider 0.5x–2.0x with value display | ✓ |
| Preset buttons | Fixed speed buttons (0.5x, 1x, 1.5x, 2x) | |
| Slider + presets | Both slider and quick-select buttons | |

| Option | Description | Selected |
|--------|-------------|----------|
| Single progress bar | Unified bar, chunking hidden | ✓ |
| Chunk-by-chunk progress | Shows "Processing chunk 3 of 7..." | |

**User's choice:** Inline progress, speed slider, single progress bar
**Notes:** Long text (5000+ words) chunking happens behind the scenes

---

## Audio Player & Downloads

| Option | Description | Selected |
|--------|-------------|----------|
| Waveform player | WaveSurfer.js with visualization + playback + downloads | ✓ |
| Simple HTML5 player | Standard audio element, no waveform | |

| Option | Description | Selected |
|--------|-------------|----------|
| Two separate buttons | "Download MP3" and "Download WAV" side by side | ✓ |
| Dropdown format picker | Single download button with format dropdown | |

| Option | Description | Selected |
|--------|-------------|----------|
| Dark & subtle | Dark waveform matching dark theme. Spotify style | ✓ |
| Gradient waveform | Colorful gradient (purple to blue) | |

| Option | Description | Selected |
|--------|-------------|----------|
| Replace output area | New generation replaces previous result | ✓ |
| Stack results | Each generation adds to a list below | |

**User's choice:** Waveform player (WaveSurfer.js), dark & subtle, two download buttons, replace on new generation

---

## Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Inline error + retry | Error message below button with Retry button | ✓ |
| Toast notification | Corner toast with error and retry link | |
| Error banner | Full-width banner at top | |

**User's choice:** Inline error messages with retry button, red outline for invalid input

---

## Generate Button Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Disable + spinner | Button shows spinner, text changes to "Generating..." | ✓ |
| Cancel option | Button becomes Cancel during generation | |

**User's choice:** Simple disable + spinner pattern

---

## Empty / Initial State

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle placeholder | Waveform placeholder + "Your audio will appear here" | ✓ |
| Hidden until ready | Output area hidden until first generation | |

**User's choice:** Subtle placeholder with hint text

---

## Text Input

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed height + counter | Fixed textarea with scrollbar, character count below | ✓ |
| Auto-expanding | Textarea grows with content up to max height | |

**User's choice:** Fixed height textarea with character count

---

## Infrastructure

| Option | Description | Selected |
|--------|-------------|----------|
| Cloud GPU | RunPod/Vast.ai NVIDIA GPU rental | |
| Try Mac first | Apple Silicon MPS backend (risky) | |
| Local NVIDIA GPU | User has RTX 3060 12GB or RTX 4070 (12GB) | ✓ |

**User's choice:** Local NVIDIA GPU (12GB VRAM)
**Notes:** Sufficient for CustomVoice (~2-3GB) plus room for all 3 models later

---

## Agent's Discretion

- Exact spacing and typography
- Waveform color details
- Progress bar animation
- Text area placeholder text and max characters
- Error message wording
- WaveSurfer.js configuration
- Text preprocessing pipeline
- Chunking strategy for long text
- Docker Compose configuration

## Deferred Ideas

- Voice cloning (user emphasized importance) — Phase 2
- Spanish audio quality validation — during Phase 1 implementation testing
- Emotion/style control — Phase 2
