# Feature Research

**Domain:** TTS / Voice Cloning Web Application
**Researched:** 2025-04-25
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any TTS product. Missing these = product feels broken or amateur.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Text-to-speech generation | Core value proposition — the entire reason the product exists | HIGH | Depends on TTS engine choice. Must handle variable-length input, proper text normalization (numbers, abbreviations, dates) |
| Voice selection catalog | Users expect to browse and pick from multiple voices, not just one | MEDIUM | Need at least 5-10 predefined voices. Murf has 200+, ElevenLabs has 100+. Even OpenAI has 6+. Start with curated set, expand later. |
| Audio playback/preview | Users must hear result before committing to download | LOW | Standard HTML5 audio player. Waveform visualization is nice-to-have but not required. |
| Audio download | Users need files for their content workflow (video editing, podcasts) | LOW | MP3 is universal. WAV for lossless. ElevenLabs supports mp3/opus/aac/flac/wav/pcm with configurable bitrate and sample rate. |
| Speed control | Every TTS product lets users adjust speech rate | LOW | Slider 0.5x–2.0x is standard. ElevenLabs: 0.25–4.0. OpenAI: 0.25–4.0. Implementation depends on engine — some support it natively, others require post-processing. |
| User accounts & auth | Public web app requires registration, saved history, voice management | MEDIUM | Standard auth (email/password or OAuth). Needed for voice cloning ownership and generation history. |
| Generation history | Users expect to see past generations and re-download | LOW | Simple list of past jobs with text, voice used, date, audio file. Essential for content creators who generate multiple pieces. |
| Text input with character/word count | Users need to know limits and plan content | LOW | Simple textarea with counter. Critical for managing expectations on free tier vs paid. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not expected by every user, but create loyalty and willingness to pay.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Voice cloning from user sample** | Killer feature — users can generate audio in their own voice or any authorized voice. This is the #1 reason users choose ElevenLabs over generic TTS. | HIGH | Two tiers: Instant Voice Cloning (IVC, 1 min sample, lower quality) and Professional Voice Cloning (PVC, 10+ min, trained model). IVC is achievable with XTTS v2 from a single reference clip. PVC requires fine-tuning pipeline. Start with IVC. |
| **SSML / prosody control** | Power users (audiobook narrators, video producers) need fine control over emphasis, pauses, pitch. This is what separates "toy" from "tool." | MEDIUM | ChatTTS supports `[uv_break]`, `[laugh]`, `[lbreak]` tokens. ElevenLabs uses voice_settings (stability, similarity_boost, style). OpenAI gpt-4o-mini-tts uses natural language "instructions" for tone/speed/emotion. For v1, expose engine-native controls rather than building custom SSML parser. |
| **Emotion/style control** | "Make it sound happy/sad/angry/whispering" — users don't think in SSML, they think in emotions. | MEDIUM | ElevenLabs: `style` parameter (0-1 scale, exaggerates speaker's natural style). OpenAI: free-form instruction ("Speak in a cheerful and positive tone"). ChatTTS: `[oral_0-9]` and `[laugh_0-2]` intensity controls. Implementation depends heavily on engine choice. Some engines have no emotion support. |
| **Cross-language voice cloning** | Clone a voice from Spanish audio, generate English speech with that same voice — massive for multilingual creators. | HIGH | XTTS v2 supports this natively (16 languages, same speaker_wav across languages). This is a unique strength of open-source XTTS that even ElevenLabs can't match easily. Strong differentiator for our product. |
| **Batch/bulk processing** | Content creators often need 50+ audio clips (e.g., video narration segments). Manual one-at-a-time is painful. | MEDIUM | Upload CSV/text file with multiple entries, process in queue, download as ZIP. Requires Celery job management already planned in architecture. |
| **Share via public link** | Collaboration feature — send audio to client/colleague without file transfer | LOW | Generate unique URL for each audio clip. Simple file serving with expiring links. ElevenLabs calls these "shares." |
| **Pronunciation dictionary** | Brand names, technical terms, proper nouns get mispronounced. Users need a way to fix this. | MEDIUM | ElevenLabs has full pronunciation dictionary API with versioning. Simpler approach: find-and-replace rules (e.g., "ttsQwen" → "T T S Qwen"). Store per-user pronunciation overrides. |
| **Context stitching (long-form continuity)** | For audiobooks/long narration, each segment should sound connected, not disjointed. | MEDIUM | ElevenLabs supports `previous_text`, `next_text`, `previous_request_ids`, `next_request_ids` to maintain prosody continuity. Critical for content longer than ~500 characters. Must implement if targeting long-form use cases. |
| **Voice settings presets** | Save tuned stability/similarity/style combos per voice so users don't re-tune every time | LOW | Named presets tied to user account. Store voice_id + settings JSON. Reduces friction for repeat users. |
| **Text chunking for long inputs** | Users paste 5000-word scripts; engine can't handle that in one pass. App must split intelligently at sentence/paragraph boundaries. | MEDIUM | XTTS supports `split_sentences=True`. Need custom chunking logic for very long texts (>5000 chars). Concatenate output audio files. Critical for production use. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time waveform audio editor | "I want to trim/edit the audio in your app" | Massive scope creep. Audio editing is a separate product category (Audacity, Adobe Audition). Adds months of development for features users already have in their existing tools. | Provide clean download in multiple formats. Users import into their preferred DAW/editor. |
| Voice marketplace (buy/sell voices) | "Let users sell their cloned voices" | Legal nightmare — voice rights, royalties, deepfake liability, content moderation. Requires contracts, payment infrastructure, DMCA handling. | Allow users to clone their OWN voice only. Consider community voice sharing (opt-in, moderated) in v2+ with proper legal framework. |
| Celebrity / character voice cloning | "I want Morgan Freeman's voice" | Massive legal liability. Right of publicity violations. Copyright issues. Can get the product shut down with lawsuits. | Only allow cloning from user's own audio samples. Implement consent verification. No pre-built celebrity voices. |
| Streaming/real-time synthesis | "Generate audio as I type" | Architecture complexity explosion. Requires WebSocket streaming, chunked inference, audio buffering. Performance requirements 10x higher. Not needed for content creation use case (batch is fine). | Batch generation with async queue. Show progress bar. Notify when done. Can add streaming in v2 for voice agent use case. |
| Built-in audio effects (reverb, EQ, compression) | "Make it sound like it's in a room" | DSP is a deep specialty. Adds significant processing overhead. Users already have these tools. | Provide clean, high-quality raw audio. Users apply effects in their existing production pipeline. |
| Video editing / timeline | "Sync the audio to my video" | Video editing is an entirely different product. VLC/Premiere/DaVinci exist for this. | Focus on audio quality. Export audio with timestamps if possible. |
| Multi-user collaboration | "My team should edit scripts together" | Adds real-time sync, conflict resolution, permissions, notifications. Major scope expansion for v1. | Single-user per account. Share via links for review. Add team features in v2. |
| AI script writing | "Write the script for me too" | Scope creep into LLM territory. Many tools already do this (ChatGPT, Jasper, etc.) | Focus on being the best TTS tool. Users bring their own scripts. Could add "enhance script for speech" as a future micro-feature. |
| Speech-to-text / transcription | "Let me upload audio and get text" | Inverse operation, different model pipeline. Adds model management complexity. | Stay focused on TTS direction only. Users have Whisper/Otter for transcription. |

## Feature Dependencies

```
[Text-to-Speech Engine]
    └──required-by──> [Voice Catalog]
    └──required-by──> [Voice Cloning]
    └──required-by──> [Prosody/SSML Control]
    └──required-by──> [Emotion Control]
    └──required-by──> [Speed Control]
    └──required-by──> [Text Chunking for Long Inputs]
                          └──required-by──> [Context Stitching]

[User Accounts/Auth]
    └──required-by──> [Voice Cloning]
    └──required-by──> [Generation History]
    └──required-by──> [Voice Settings Presets]
    └──required-by──> [Pronunciation Dictionary]
    └──required-by──> [Share via Link]

[Async Job Queue (Celery + Redis)]
    └──required-by──> [Batch/Bulk Processing]
    └──required-by──> [Voice Cloning (PVC training)]
    └──required-by──> [Text Chunking for Long Inputs]

[Voice Cloning]
    └──enhances──> [Cross-Language Voice Cloning]

[Emotion Control] ──conflicts──> [Voice Cloning (some engines don't support both simultaneously)]

[SSML / Prosody Control] ──enhances──> [Emotion Control] (SSML is the implementation layer)

[Pronunciation Dictionary] ──enhances──> [Batch Processing] (apply corrections across bulk jobs)
```

### Dependency Notes

- **TTS Engine is the foundation for everything:** Engine choice (XTTS v2, ChatTTS, Bark, etc.) determines which features are even possible. This decision MUST come first and constrains all subsequent features.
- **User accounts required for voice cloning:** Users must own their cloned voices. Anonymous voice cloning creates abuse vectors (deepfakes). Tie voices to authenticated users.
- **Async queue required for anything heavy:** Audio generation is GPU-bound (5-30s per clip). Voice cloning training is even heavier. Without Celery, the API blocks on every request.
- **Text chunking enables long-form:** Without intelligent text splitting, max input is ~500 chars for most models. Content creators need 5000+ word scripts handled gracefully.
- **Emotion control may conflict with voice cloning:** Some engines (like basic XTTS) don't allow emotion/style parameters when using a reference voice. Need to test and potentially use different engines for different feature combinations.
- **SSML is the implementation layer for emotion:** Rather than building a custom emotion system, expose engine-native prosody controls and build a user-friendly emotion layer on top.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **Text-to-speech generation** — The core. Without this, nothing else matters.
- [x] **Voice catalog (5-10 predefined voices)** — Users need choices. Curate quality over quantity.
- [x] **Audio playback/preview** — Hear before downloading. Standard web audio player.
- [x] **Audio download (MP3 + WAV)** — Content creators need files for their workflow.
- [x] **Speed control** — Simple slider. Every competitor has it.
- [x] **User accounts (email/password)** — Required for voice cloning ownership and history.
- [x] **Generation history** — Past generations list with re-download. Essential UX.
- [x] **Basic voice cloning (IVC — instant, 1 sample)** — This is THE differentiator. Without it, we're just another TTS wrapper. XTTS v2 can do this from a single reference clip.
- [x] **Text chunking for long inputs** — Users WILL paste long scripts. Must handle gracefully.

### Add After Validation (v1.x)

Features to add once core is working and users are engaged.

- [ ] **Emotion/style control** — Trigger: users asking "can it sound happier?" Natural next request after basic TTS works.
- [ ] **SSML / prosody controls** — Trigger: power users wanting fine control over emphasis and pauses.
- [ ] **Batch/bulk processing** — Trigger: users generating 10+ clips per session. They'll want automation.
- [ ] **Share via public link** — Trigger: users sharing files via other means (email, Drive). Make it seamless.
- [ ] **Pronunciation dictionary** — Trigger: repeated complaints about brand name mispronunciation.
- [ ] **Voice settings presets** — Trigger: users re-tuning the same settings repeatedly.
- [ ] **Cross-language voice cloning** — Trigger: users wanting their cloned voice in another language. Unique to XTTS.
- [ ] **Context stitching** — Trigger: long-form creators complaining about disjointed segments.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Professional Voice Cloning (PVC — multi-sample, trained model)** — Higher quality but requires training pipeline, GPU hours, and storage management. Only worth building if IVC gains traction.
- [ ] **Streaming synthesis** — Only if pivoting to voice agent use case. Batch is fine for content creation.
- [ ] **API for third parties** — New revenue stream but different product. Requires rate limiting, billing, documentation.
- [ ] **Community voice sharing (opt-in, moderated)** — Requires legal framework, content moderation, consent management.
- [ ] **Multi-idioma beyond ES/EN** — Start with Spanish and English. Add languages based on user demand data.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Text-to-speech generation | HIGH | HIGH | P1 |
| Voice catalog | HIGH | LOW | P1 |
| Audio playback/preview | HIGH | LOW | P1 |
| Audio download | HIGH | LOW | P1 |
| Speed control | MEDIUM | LOW | P1 |
| User accounts | HIGH | MEDIUM | P1 |
| Generation history | MEDIUM | LOW | P1 |
| Voice cloning (IVC) | HIGH | HIGH | P1 |
| Text chunking | MEDIUM | MEDIUM | P1 |
| Emotion/style control | HIGH | MEDIUM | P2 |
| SSML/prosody controls | MEDIUM | MEDIUM | P2 |
| Batch processing | MEDIUM | MEDIUM | P2 |
| Share via link | LOW | LOW | P2 |
| Pronunciation dictionary | MEDIUM | MEDIUM | P2 |
| Voice settings presets | LOW | LOW | P2 |
| Cross-language cloning | HIGH | LOW | P2 |
| Context stitching | MEDIUM | MEDIUM | P2 |
| Professional voice cloning (PVC) | HIGH | HIGH | P3 |
| Streaming synthesis | LOW | HIGH | P3 |
| API for third parties | MEDIUM | HIGH | P3 |
| Community voice sharing | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | ElevenLabs | Murf.ai | OpenAI TTS | Our Approach |
|---------|------------|---------|------------|--------------|
| Voice catalog | 100+ voices, community voices | 200+ voices, 35+ languages | 6-9 voices (alloy, echo, nova, etc.) | Start with 5-10 curated voices. Quality > quantity. |
| Voice cloning | IVC (1 min) + PVC (trained, high quality) | Enterprise only, ethically sourced | Not available | IVC via XTTS v2 from single reference clip. PVC later if demand exists. |
| Emotion/style | `style` param (0-1), `stability` param | Pitch/speed/intonation sliders | Free-form "instructions" prompt | Expose engine-native controls first. Build user-friendly emotion layer on top. |
| SSML support | Partial (pronunciation dictionaries, voice settings) | Full pitch/speed/emphasis control | Not available | Leverage ChatTTS tokens `[uv_break]`, `[laugh]` or XTTS native controls. Build intuitive UI over raw tokens. |
| Speed control | 0.25–4.0x | 0.5–2.0x | 0.25–4.0x | 0.5–2.0x range, engine-native when possible. |
| Audio formats | mp3/opus/aac/flac/wav/pcm (28 format variants) | mp3, wav | mp3/opus/aac/flac/wav/pcm | mp3 + wav for v1. Add opus/flac later. |
| Batch processing | Projects feature (long-form, chapters) | Not in Studio | Not available | CSV upload → queue → ZIP download. Leverage Celery. |
| Cross-language voice cloning | Yes (multilingual models) | Dubbing product (separate) | Not available | XTTS v2 native support — clone from Spanish, generate in English. Strong differentiator. |
| Streaming | WebSocket streaming, <200ms latency | Falcon model, 130ms TTFA | SSE streaming | Not for v1. Batch with progress notification. |
| Pronunciation | Full dictionary API with versioning | Custom pronunciation library | Not available | User-level find-replace rules for v1. Dictionary API later. |
| Long-form continuity | previous_text/next_text, request_ids stitching | Not available | Not available | Text chunking with sentence-boundary splitting. Context stitching as P2. |
| Pricing model | Character-based (free tier: 10k chars/mo) | Character/seat-based | Per-character ($15/1M chars) | Character-based with daily/monthly limits. Free tier for validation. |

## Key Insight: Engine Choice Determines Feature Possibility

The most critical architectural decision is the TTS engine, because it determines which features are even possible:

| Engine | Voice Cloning | Emotion Control | Multi-language | Cross-lang Cloning | Streaming | Quality |
|--------|--------------|-----------------|----------------|-------------------|-----------|---------|
| XTTS v2 | YES (single ref) | Limited | YES (16 langs) | YES | YES (<200ms) | HIGH |
| ChatTTS | Partial (speaker embed) | YES (tokens) | Chinese/English | NO | NO | MEDIUM |
| Bark | Partial (history_prompt) | Partial ([laughs]) | YES (multilingual) | NO | NO | MEDIUM |
| OpenAI API | NO | YES (instructions) | YES | NO | YES | HIGH |
| ElevenLabs API | YES (IVC+PVC) | YES (style/stability) | YES (29 langs) | YES | YES | HIGHEST |

**Recommendation:** XTTS v2 as primary engine for self-hosted voice cloning + cross-language capability. Supplement with OpenAI/ElevenLabs API for predefined voices if self-hosted quality isn't sufficient.

## Sources

- ElevenLabs API documentation (Context7, verified 2025): voice cloning API, voice settings, pronunciation dictionaries, streaming, output formats
- OpenAI TTS API documentation (Context7, verified 2025): gpt-4o-mini-tts model with instruction-based emotion control, response formats
- Coqui TTS / XTTS v2 documentation (Context7, verified 2025): voice cloning API, cross-language cloning, streaming inference
- ChatTTS documentation (Context7, verified 2025): prosody control tokens, speaker embedding, emotion parameters
- Bark documentation (Context7, verified 2025): voice presets, multilingual generation
- Murf.ai website analysis (verified 2025): feature set includes 200+ voices, 35+ languages, voice cloning (enterprise), dubbing, Falcon API for voice agents

---
*Feature research for: TTS/Voice Cloning Web Application*
*Researched: 2025-04-25*
