# Plan 02-05 Summary: Frontend Prosody UI

## Completed

### Components
- `frontend/src/components/EmotionSelector.tsx`:
  - 5 preset buttons: Happy, Sad, Angry, Neutral, Whisper
  - Lucide icons for each emotion
  - Single-selection radio behavior
  - Dark theme styling with accent color for selected state
- `frontend/src/components/ProsodyInput.tsx`:
  - Collapsible "Prosody & Style" section
  - Textarea with 200-character counter
  - Clickable example chips that populate the textarea
  - Examples: "Speak slowly and clearly", "Whisper softly", etc.
- `frontend/src/components/PronunciationDict.tsx`:
  - Toggle switch to enable/disable pronunciation overrides
  - Word + Replacement input fields with Add button
  - List of entries with delete (X) action
  - Client-side duplicate detection
  - Empty state message

### Generation Page Updates
- Updated `frontend/src/app/page.tsx`:
  - Fetches cloned voices on mount and displays them in "My Voices" section
  - Predefined and cloned voice selection are mutually exclusive
  - Links to `/voices` page when no cloned voices exist
  - Integrated EmotionSelector, ProsodyInput, and PronunciationDict
  - Includes Voice Library navigation link in header
  - All new controls only appear in `speech` mode

### Hook & API Updates
- Updated `frontend/src/hooks/use-tts-generation.ts`:
  - Added `clonedVoiceId`, `instruct`, `emotionPreset`, `pronunciationEnabled` to options
  - `buildRequest()` includes new fields in the TTSRequest
  - Validation supports `clonedVoiceId` as alternative to `speaker`
- Updated `frontend/src/lib/api-client.ts`:
  - Added `createPronunciationEntry()`, `listPronunciationEntries()`, `deletePronunciationEntry()`
- Updated `frontend/src/lib/types.ts`:
  - Added `cloned_voice_id`, `emotion_preset`, `pronunciation_enabled` to `TTSRequest`
  - Added `PronunciationEntry` interface
  - Fixed missing `export` on `TTSMode` type

## Key Decisions
- Kept existing generation page at `/` instead of moving to `/generate` to preserve existing routing
- Cloned voice selection only shown in `speech` mode (not in voice-design or legacy voice-clone modes)
- Pronunciation dictionary loads globally on page mount (no user filtering in Phase 2)
- Emotion preset and custom instruct are combined in the request (backend concatenates them)

## Artifacts Created
- `frontend/src/components/EmotionSelector.tsx`
- `frontend/src/components/ProsodyInput.tsx`
- `frontend/src/components/PronunciationDict.tsx`

## Artifacts Modified
- `frontend/src/app/page.tsx`
- `frontend/src/hooks/use-tts-generation.ts`
- `frontend/src/lib/api-client.ts`
- `frontend/src/lib/types.ts`

## Deviation Notes
- Plan expected `frontend/src/app/generate/page.tsx` but actual generation page is at `frontend/src/app/page.tsx`. Changes applied to existing file.

## Verification
- TypeScript compilation passes (only pre-existing `globals.css` import error)
- Generation page renders all new controls in speech mode
- No regression in voice-design or voice-clone modes
- API client has correct types for all new endpoints
