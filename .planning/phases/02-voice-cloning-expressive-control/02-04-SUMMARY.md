# Plan 02-04 Summary: Frontend Voice Clone UI

## Completed

### API Client
- Updated `frontend/src/lib/api-client.ts`:
  - Changed `getSpeakers()` to use `/voices/predefined` endpoint
  - Added `uploadVoice(audioFile, refText, name)` — multipart upload
  - Added `listVoices()` — fetch cloned voices
  - Added `updateVoice(voiceId, name)` — rename voice
  - Added `deleteVoice(voiceId)` — delete voice
- Updated `frontend/src/lib/types.ts`:
  - Added `VoiceResponse` interface
  - Fixed missing `export` on `TTSMode` type (pre-existing bug)

### Components
- `frontend/src/components/VoiceUploader.tsx`:
  - Drag-and-drop file upload with click fallback
  - Accepts WAV, MP3, OGG, WebM (max 20 MB client-side check)
  - Voice name and reference transcript inputs
  - Upload progress with loading spinner
  - Error display with server messages
- `frontend/src/components/VoiceRecorder.tsx`:
  - Browser microphone recording via `MediaRecorder` API
  - Recording states: idle → recording → preview
  - Timer display (MM:SS), min 3s, max 60s auto-stop
  - Audio preview with native `<audio>` controls
  - Voice name and reference transcript inputs
  - Error handling for permission denied
- `frontend/src/components/VoiceManager.tsx`:
  - Grid layout of voice cards (1/2/3 columns responsive)
  - Each card shows name, duration, sample rate, audio preview
  - Inline rename (pencil icon → input → checkmark save)
  - Delete with confirmation dialog (AlertTriangle + Cancel/Delete)
  - Loading skeletons and empty state

### Page
- `frontend/src/app/voices/page.tsx`:
  - Next.js App Router page at `/voices`
  - Tabbed interface: Upload Audio / Record Audio
  - "Your Voices" section with VoiceManager
  - Auto-refreshes voice list after upload/record
  - Back to Generator link
  - Dark theme, responsive max-width container

## Key Decisions
- No shadcn/ui available in the project — all components use custom Tailwind CSS with the project's CSS variable theme system
- Audio preview uses native `<audio>` controls for simplicity; actual audio serving path is a placeholder (`/api/audio/voices/{id}`) since audio serving wasn't part of this plan
- Recording produces WebM blobs; backend already accepts WebM via content-type validation

## Artifacts Created
- `frontend/src/components/VoiceUploader.tsx`
- `frontend/src/components/VoiceRecorder.tsx`
- `frontend/src/components/VoiceManager.tsx`
- `frontend/src/app/voices/page.tsx`

## Artifacts Modified
- `frontend/src/lib/api-client.ts`
- `frontend/src/lib/types.ts`

## Deviation Notes
- Plan expected `frontend/src/lib/api.ts` but actual file is `frontend/src/lib/api-client.ts`. All API methods added to existing file.

## Verification
- TypeScript compilation passes (only pre-existing `globals.css` import error)
- All new components render correctly with dark theme styling
- API client methods have correct types and return signatures
