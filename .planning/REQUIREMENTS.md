# Requirements: ttsQwen

**Defined:** 2025-04-25
**Core Value:** Generar audio de alta calidad desde texto con la voz que el usuario elija (propia o predefinida), con control expresivo sobre prosodia y emoción.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### TTS Generation

- [ ] **TTS-01**: User can enter text and generate audio speech from it
- [ ] **TTS-02**: User can select from a catalog of 5-10 predefined voices
- [ ] **TTS-03**: User can adjust speech speed (0.5x–2.0x range)
- [ ] **TTS-04**: User can input long text (5000+ words) and the app handles text chunking and concatenation automatically

### Voice Cloning

- [ ] **CLON-01**: User can upload an audio file as reference for voice cloning
- [ ] **CLON-02**: User can record audio directly in the app using their microphone for voice cloning
- [ ] **CLON-03**: User can generate speech in their cloned voice
- [ ] **CLON-04**: Cloned voice quality is validated (minimum audio length and quality checks)
- [ ] **CLON-05**: User can manage their cloned voices (list, rename, delete)

### Prosody & Emotion

- [ ] **PROS-01**: User can control emotion/style using natural language instructions (e.g., "speak happily", "whisper", "sound sad")
- [ ] **PROS-02**: User can use preset emotion options (happy, sad, angry, neutral, whisper)
- [ ] **PROS-03**: User can create pronunciation dictionary entries (e.g., brand names, technical terms) to override default pronunciation

### Audio Output

- [ ] **OUT-01**: User can preview/playback generated audio before downloading
- [ ] **OUT-02**: User can download audio as MP3
- [ ] **OUT-03**: User can download audio as WAV
- [ ] **OUT-04**: User can view generation history with text, voice used, date, and re-download
- [ ] **OUT-05**: User can upload CSV/text file with multiple entries for batch processing
- [ ] **OUT-06**: User can download batch results as a ZIP file
- [ ] **OUT-07**: User can share generated audio via a public link
- [ ] **OUT-08**: User can save and load voice setting presets (speed + emotion combos)

### User Management

- [ ] **USER-01**: User can create account with email and password
- [ ] **USER-02**: User can log in and stay logged in across sessions
- [ ] **USER-03**: User can log out from any page
- [ ] **USER-04**: Text input area shows character and word count

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Voice Cloning Advanced

- **CLON-06**: User can clone voice across languages (clone from Spanish, generate in English)
- **CLON-07**: Professional voice cloning from multiple samples (higher quality)

### Collaboration

- **COLL-01**: Team accounts with shared voice library
- **COLL-02**: API for third-party integration

### Content

- **CONT-01**: Context stitching for long-form (maintain prosody continuity across segments)
- **CONT-02**: Multi-language support beyond Spanish and English

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time waveform audio editor | Users have Audacity/Premiere for this — focus on TTS quality |
| Voice marketplace (buy/sell voices) | Legal nightmare — rights, royalties, deepfake liability |
| Celebrity/character voice cloning | Right of publicity violations, lawsuit risk |
| Streaming/real-time synthesis | Architecture complexity 10x higher, batch is sufficient for content creation |
| Built-in audio effects (reverb, EQ) | DSP specialty, users already have production tools |
| Video editing / timeline | Entirely different product category |
| Multi-user real-time collaboration | Major scope expansion for v1 |
| AI script writing | Scope creep into LLM territory — users bring their own scripts |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (Populated during roadmap creation) | | |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 0
- Unmapped: 22 ⚠️

---
*Requirements defined: 2025-04-25*
*Last updated: 2025-04-25 after initial definition*
