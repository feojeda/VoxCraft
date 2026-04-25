# Pitfalls Research

**Domain:** TTS / Voice Cloning Web Application
**Researched:** 2026-04-25
**Confidence:** HIGH (official docs + Context7 verified + ecosystem patterns)

## Critical Pitfalls

### Pitfall 1: GPU Memory Leaks and OOM During Inference

**What goes wrong:**
TTS models (Qwen3-TTS 1.7B, XTTS v2) consume 4-10 GB of GPU VRAM just loaded. Each inference allocates additional tensors. If the worker process doesn't properly release GPU memory between tasks, memory fragments accumulate until CUDA OOM crashes the worker. A Celery worker restart loses the loaded model, causing a 30-90 second cold-start delay for the next task while the model reloads.

**Why it happens:**
PyTorch holds onto GPU memory in its caching allocator by default. TTS models generate intermediate tensors (attention weights, mel spectrograms, codec codes) that stay referenced if the inference function doesn't explicitly `del` them and call `torch.cuda.empty_cache()`. Celery's default prefork worker model forks processes but shares CUDA context poorly — GPU state doesn't cleanly reset between tasks.

**How to avoid:**
- Use a **singleton model loader** — load the model once at worker startup, never per-request.
- Wrap inference in explicit memory management: `torch.no_grad()`, `torch.inference_mode()`, `del` intermediate tensors, `torch.cuda.empty_cache()` after each synthesis.
- Set Celery `worker_concurrency=1` for GPU workers — one inference at a time per GPU. Multiple concurrent inferences on one GPU cause memory contention.
- Use `worker_prefetch_multiplier=1` to avoid pulling tasks the GPU can't process yet.
- Implement a health-check endpoint that reports GPU memory usage. Alert when usage creeps up across tasks (sign of a leak).
- Consider using `--max-tasks-per-child` in Celery to periodically recycle workers and reclaim leaked memory.

**Warning signs:**
- GPU memory usage trending upward across sequential tasks (never returning to baseline)
- Worker process silently dying (Celery shows "worker lost" errors)
- First task after restart takes 30-90s (model reload)
- Tasks succeeding when queue is empty but failing when backlogged

**Phase to address:**
Phase 1 (Infrastructure/Worker setup) — this must be designed into the worker architecture from day one. Retrofitting GPU memory management is extremely painful.

---

### Pitfall 2: Poor Reference Audio Quality Destroys Voice Cloning

**What goes wrong:**
Voice cloning quality is catastrophically sensitive to the reference audio. A noisy recording, a clip with background music, reverb, or a sample that's too short (under 3 seconds) produces garbled, robotic, or artifact-heavy output. Users don't understand this — they upload whatever they have. The result: the app "works" but produces terrible audio, and users blame the app, not their input.

**Why it happens:**
TTS models like Qwen3-TTS Base and XTTS v2 extract speaker embeddings (x-vectors or d-vectors) from the reference audio. These embeddings capture the entire acoustic profile, including noise, room reverb, and microphone coloration. The model faithfully reproduces these artifacts in the output. There is no "auto-denoise" built into the model.

**How to avoid:**
- **Validate reference audio before accepting it** — check: duration (minimum 3s, ideally 6-15s for Qwen3-TTS ICL mode), sample rate (16kHz+), SNR estimate, clipping detection, silence ratio.
- **Guide the user with explicit recording instructions** — "Record in a quiet room, hold the phone 15cm from your mouth, speak naturally for at least 6 seconds."
- **Provide a real-time waveform preview** with visual indicators of quality (noise floor, clipping).
- **Use multiple reference files when possible** — both Qwen3-TTS and XTTS support averaging multiple references, which dramatically improves robustness.
- **Transcribe the reference audio** — Qwen3-TTS ICL mode requires `ref_text` for best quality. If you don't provide it, quality drops to x-vector-only mode (lower fidelity).
- **Pre-process the audio** — normalize volume, trim silence, resample to model's expected rate (Qwen3-TTS uses 24kHz internally, XTTS v2 uses 16/22kHz).

**Warning signs:**
- Users complaining about "robotic" or "metallic" cloned voices
- High abandonment rate on the voice cloning flow
- Cloned voice quality varying wildly between users
- Support tickets about "it doesn't sound like me"

**Phase to address:**
Phase 2 (Voice cloning feature) — audio validation pipeline must ship with the cloning feature, not bolted on after.

---

### Pitfall 3: Synchronous TTS Inference Blocks API Responses

**What goes wrong:**
Running TTS inference inside a FastAPI request handler means the HTTP connection stays open for 5-60 seconds while the model generates audio. The user's browser shows a loading spinner. If multiple users request simultaneously, the API workers exhaust and all requests timeout. The app feels broken.

**Why it happens:**
TTS inference is fundamentally a batch operation. A 1.7B parameter model takes 2-10 seconds to generate even a short sentence on a T4 GPU, and 30-60 seconds for a paragraph. This is incompatible with synchronous HTTP request-response patterns.

**How to avoid:**
- **Always use async task pattern**: API receives request → enqueues Celery task → returns task ID immediately → frontend polls/websockets for completion.
- Separate the API layer (FastAPI) from the inference layer (Celery workers on GPU machines). They can even be on different servers.
- Use WebSocket or SSE for progress updates so the user isn't staring at a blank screen.
- For preview (short text), consider a separate fast-path with a smaller model or pre-computed samples.

**Warning signs:**
- API response times over 2 seconds
- Timeout errors under concurrent load
- FastAPI workers reporting "request took too long"

**Phase to address:**
Phase 1 (Infrastructure) — this is an architectural decision, not a feature. The async worker pattern must be established in the first phase.

---

### Pitfall 4: Text Normalization Failures Produce Garbled Speech

**What goes wrong:**
Users paste text with numbers ("1,234"), abbreviations ("Dr. Smith"), URLs ("https://..."), special characters ("@username", "#hashtag"), mixed language text, or formatting artifacts from copy-paste. The TTS model either mispronounces these, skips them, produces artifacts, or crashes on unexpected Unicode.

**Why it happens:**
TTS models are trained on clean, normalized text. They don't naturally handle the messiness of real user input. "Dr." could be "Doctor" or "Drive". "1,234" could be "one thousand two hundred thirty four" or "one comma two three four". URLs are meaningless phonetically. Emoji in the text can cause tokenization errors.

**How to avoid:**
- **Build a text preprocessing pipeline BEFORE sending to the model**:
  1. Strip HTML/markdown artifacts
  2. Expand abbreviations (context-dependent)
  3. Normalize numbers to words (language-aware — "1,234" in English vs Spanish)
  4. Replace or remove URLs, emails, handles
  5. Strip emoji and unsupported Unicode
  6. Sentence segmentation for long text
  7. Language detection for mixed-language input
- Qwen3-TTS has improved robustness to noisy text per its README, but don't rely on it for production — always pre-process.
- Test with adversarial inputs: copy-pasted text from web pages, social media posts, academic papers with formulas.

**Warning signs:**
- Users complaining about mispronunciations of common words
- Model producing audio artifacts or silence for certain inputs
- Crashes on text with special characters

**Phase to address:**
Phase 1 (Core TTS feature) — text preprocessing is part of the core pipeline. Without it, no demo will work reliably.

---

### Pitfall 5: Celery Task Timeout Kills Long Audio Generation

**What goes wrong:**
A user submits a 5,000-character text for batch generation. The TTS model processes it in chunks, but Celery's default behavior kills any task that exceeds its time limit. The task is marked as failed, the audio is lost, and the user sees an error. Worse: the worker process may be killed mid-GPU-operation, leaving GPU memory in a bad state.

**Why it happens:**
Celery's `task_time_limit` (hard limit) sends SIGKILL to the worker process. This is unrecoverable. The `task_soft_time_limit` sends a `SoftTimeLimitExceeded` exception that can be caught, but many developers don't set soft limits or handle them. TTS generation time scales roughly linearly with text length, so long texts predictably exceed short timeouts.

**How to avoid:**
- **Set generous time limits**: `task_soft_time_limit=300` (5 min), `task_time_limit=600` (10 min) for TTS tasks.
- **Implement chunked processing**: split long text into paragraphs/sentences, process each as a sub-task, then concatenate audio. This also enables progress reporting.
- **Catch `SoftTimeLimitExceeded`** and save partial results if possible.
- **Use Celery chords or chains** for multi-step generation: split text → generate chunks in parallel → concatenate → return.
- Report estimated processing time to the user based on text length.

**Warning signs:**
- Tasks failing only for long texts
- "Worker lost" errors in Celery logs
- Users complaining that "it worked for short text but not long text"

**Phase to address:**
Phase 1 (Infrastructure) — task timeout configuration is part of worker setup. Chunked processing should be designed into the generation pipeline from the start.

---

### Pitfall 6: Voice Cloning Without Consent Creates Legal Liability

**What goes wrong:**
Users clone voices of celebrities, politicians, ex-partners, or other non-consenting individuals. The generated audio is used for harassment, misinformation, or fraud. The platform becomes legally liable for facilitating deepfakes. Coqui TTS's own documentation states: "Voice cloning raises several ethical concerns and must not be used to impersonate individuals without their consent."

**Why it happens:**
It's technically trivial to upload any audio file. Without guardrails, the app becomes a deepfake generation tool. Many jurisdictions now have laws against non-consensual voice cloning (EU AI Act, US state laws).

**How to avoid:**
- **Implement consent verification**: require the user to record a specific passphrase in real-time (not upload a file) to prove they are the voice owner. Or require explicit checkbox consent.
- **Watermark generated audio**: embed inaudible markers identifying the audio as AI-generated and linking to the generating user.
- **Rate-limit generation per user** to prevent bulk abuse.
- **Display clear ToS** about acceptable use of voice cloning.
- **Log all voice cloning operations** for accountability (with appropriate privacy measures).
- Consider requiring account verification (email, phone) before allowing voice cloning.

**Warning signs:**
- Users cloning obvious celebrity voices
- Generated audio appearing on social media out of context
- Legal complaints or cease-and-desist requests

**Phase to address:**
Phase 2 (Voice cloning feature) — consent and safety mechanisms must ship with the feature, not added later.

---

### Pitfall 7: Audio Format and Sample Rate Mismatches

**What goes wrong:**
The TTS model generates audio at 24kHz (Qwen3-TTS) or 22.05kHz (XTTS v2). The user expects MP3 or WAV at 44.1kHz. If you serve the raw model output without conversion, the audio plays at the wrong pitch/speed in the browser, or the browser refuses to play the format entirely. Converting between formats introduces artifacts if done incorrectly.

**Why it happens:**
Each model has a fixed output sample rate. The browser's `<audio>` element supports specific codecs and rates. MP3 encoding requires specific sample rates (44.1kHz, 48kHz, etc.). Naive resampling (like linear interpolation) introduces audible artifacts. The pipeline from model output → file storage → browser playback has multiple format conversion points, and each is an opportunity for mismatch.

**How to avoid:**
- **Standardize on one output format internally** (e.g., WAV at native model sample rate for storage).
- **Convert to user-requested format on download**: use `soundfile` or `pydub`/`ffmpeg` for high-quality resampling and encoding.
- **Use proper resampling** (soxr or scipy.signal.resample_poly) — never linear interpolation.
- **Test the full pipeline**: model output → save → load → play in Chrome, Firefox, Safari, and mobile browsers.
- Store audio in a format that preserves quality (WAV/FLAC) and convert to MP3/AAC only at download time.

**Warning signs:**
- Audio sounds "chipmunked" or slowed down in the browser
- Audio files that won't play on certain devices
- Users reporting "static" or "distortion" in output

**Phase to address:**
Phase 1 (Core TTS) — the audio pipeline from model to browser must be correct from the first working version.

---

### Pitfall 8: SSML Parsing Complexity Explodes Beyond Expectations

**What goes wrong:**
Supporting SSML markup sounds simple — add `<break>`, `<emphasis>`, `<prosody>` tags. But real SSML is a complex XML dialect with nested tags, attribute parsing, and edge cases. Users paste malformed SSML, browsers inject unwanted tags, and the model doesn't support all SSML features. The parsing code becomes a bug factory.

**Why it happens:**
SSML is a W3C standard designed for full speech synthesis engines, not neural TTS models. Most open-source TTS models (including Qwen3-TTS) don't natively understand SSML — they work with plain text and natural language instructions. You end up building a translation layer from SSML to model-specific instructions, which is complex and fragile.

**How to avoid:**
- **Don't implement full SSML** — implement a minimal subset that maps cleanly to your model's capabilities.
- **Use the model's native instruction system** instead: Qwen3-TTS uses natural language `instruct` parameter ("speak angrily", "whisper", "fast pace"). Map your SSML subset to these instructions.
- **Parse with a proper XML parser** (not regex) — `lxml` or `xml.etree.ElementTree`.
- **Validate SSML before processing** — reject malformed input early with clear error messages.
- **Consider a simpler alternative**: instead of SSML, offer a visual prosody editor (sliders for speed, pitch, emphasis markers on text). Much better UX for non-technical content creators.

**Warning signs:**
- Growing number of edge cases in SSML parsing code
- Users reporting that certain SSML tags are "ignored"
- Parser errors on valid-looking markup
- Code spending more time on SSML handling than on audio generation

**Phase to address:**
Phase 3 (Prosody/SSML control) — this is a feature phase that needs careful scoping. The "minimal SSML subset + visual editor" approach should be decided upfront.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Run TTS inference in FastAPI request handler | Faster to build, no Celery setup | API freezes under load, unscalable | Never — this is an architectural decision |
| Store audio files on local filesystem | Simple, no cloud storage setup | Can't scale horizontally, files lost on restart, no sharing | MVP only with <10 users, migrate before launch |
| Skip text preprocessing | Ship faster | Garbled output for real-world input, user complaints | Never — at minimum strip HTML and normalize numbers |
| Hardcode one TTS model | Simpler code | Can't switch models, locked into one model's quirks | MVP acceptable if behind an abstraction layer |
| Skip audio validation on voice upload | Faster cloning flow | Terrible cloning quality, user frustration | Never — validate minimum duration and SNR |
| Use SQLite for production | Zero setup | Concurrent writes fail under load, no Celery result backend reliability | MVP only with single-worker setup |
| Ignore GPU memory management | It works for demos | Silent OOM crashes in production, worker instability | Never in production — acceptable for local dev only |

## Integration Gotchas

Common mistakes when connecting to external services and libraries.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| PyTorch CUDA | Loading model on every request | Load model once at worker startup, keep in memory |
| Celery + GPU | Using prefork pool with CUDA | Use solo or gevent pool with `worker_concurrency=1` for GPU workers; CUDA contexts don't fork cleanly |
| Redis broker | Not setting `visibility_timeout` | Set `visibility_timeout` > longest task time, otherwise Redis re-queues long-running tasks while they're still processing |
| FastAPI file upload | Accepting audio without size/format validation | Validate: file size (< 20MB), format (WAV, MP3, OGG, FLAC), duration (3s-60s), sample rate (>= 16kHz) |
| Soundfile / audio I/O | Saving model output directly as MP3 | Model outputs numpy arrays — save as WAV first, then convert to MP3 via ffmpeg/pydub for download |
| Qwen3-TTS ref_audio | Passing arbitrary audio format | Qwen3-TTS accepts paths, URLs, base64, or (numpy_array, sample_rate) tuples — but pre-process to correct sample rate first |
| Celery task results | Polling task status in a tight loop | Use WebSocket/SSE for task completion notification, or poll with exponential backoff (500ms → 2s → 5s) |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Single Celery worker for all tasks | Queue backlog, 5+ minute wait times during peak | Separate queues: `tts_fast` (short text), `tts_batch` (long text, bulk). Route by text length. | 10+ concurrent users |
| Serving audio files through FastAPI | API becomes I/O bound, slow response times | Use a static file server (nginx) or object storage (S3/MinIO) with signed URLs for audio delivery | 50+ audio downloads/hour |
| No model warm-up on worker start | First user request takes 30-90s (model load + compile) | Load model during worker startup via Celery `worker_init` signal. Run one dummy inference to warm up CUDA kernels | First user always |
| Processing long text in one shot | Task timeout, GPU OOM for very long texts | Split text into chunks (200-500 chars), process in parallel across multiple tasks, concatenate results | Texts over 1000 characters |
| No audio caching | Regenerating identical text + voice + settings | Hash text + voice_id + settings → cache key. Store generated audio. Return cached version on repeat requests. | Any scale with repeat usage |
| SQLite under concurrent Celery workers | "database is locked" errors, task result loss | Migrate to PostgreSQL before running multiple workers | 2+ Celery workers |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| No voice cloning consent mechanism | Users create deepfakes of non-consenting people; legal liability under EU AI Act and state laws | Require real-time voice verification or explicit consent checkbox. Log all cloning operations. Watermark output audio. |
| Unrestricted audio upload size | Disk exhaustion, OOM when processing huge files, DoS vector | Limit upload size (20MB), duration (60s), validate format before processing |
| No rate limiting on generation | GPU resource exhaustion, cost explosion (cloud GPU), abuse for bulk content generation | Per-user rate limits: X generations/hour, Y total audio minutes/day. Require authentication for generation. |
| Storing user audio without encryption | Privacy violation, voice biometric data is PII under GDPR | Encrypt voice samples at rest. Provide user-facing deletion mechanism. Set retention policy. |
| Exposing Celery broker (Redis) without auth | Anyone can inject tasks, consume GPU resources, extract user data | Redis AUTH, firewall rules, never expose Redis port publicly |
| Generated audio accessible via predictable URLs | Anyone can access other users' generated audio | Use signed URLs with expiration (S3 presigned URLs or token-based access) |
| No input sanitization on TTS text | Injection attacks via text field, SSML injection | Sanitize text input, validate SSML against schema, strip script tags and HTML |

## UX Pitfalls

Common user experience mistakes in TTS/voice cloning applications.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progress feedback during generation | User thinks app is broken, refreshes page, duplicates request | Show progress bar or status updates (queuing → processing → done). Use WebSocket for real-time updates. |
| Accepting any audio for voice cloning without feedback | Cloned voice sounds terrible, user doesn't know why | Show audio quality indicator during upload. Reject low-quality samples with specific feedback ("too much background noise", "too short, need at least 6 seconds"). |
| No audio preview before download | User generates, downloads, opens in external player, discovers it's wrong | Always provide inline audio player with waveform visualization. Let user re-generate before downloading. |
| SSML input for non-technical users | Content creators don't know SSML; they type text and expect it to work | Provide a visual prosody editor: highlight text → apply emphasis, drag sliders for speed/pitch, click to add pauses. SSML is the backend representation, not the user interface. |
| No voice management after cloning | User uploads a voice, can't find it later, uploads again, creates duplicates | Voice library UI: list cloned voices with preview, rename, delete. Show which voice was used for each generation. |
| Assuming all users speak one language | Mixed language text (Spanish + English) breaks or produces wrong pronunciation | Auto-detect language per sentence. Qwen3-TTS supports `language="auto"` for adaptive language switching. Inform user of detected language. |
| No error messages for failed generations | User clicks "Generate", nothing happens, no feedback | Show specific errors: "Text too long (max 5000 chars)", "Voice sample too short", "Queue busy, estimated wait: 2 min". Never show raw exception traces. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Voice cloning:** Often missing audio quality validation — verify with noisy, short, and low-sample-rate inputs
- [ ] **Audio generation:** Often missing text preprocessing — verify with URLs, numbers, abbreviations, emoji, mixed-language text
- [ ] **Audio playback:** Often missing cross-browser testing — verify in Chrome, Firefox, Safari (desktop + mobile), and with various audio formats
- [ ] **Worker reliability:** Often missing GPU memory cleanup — verify memory returns to baseline after 100 sequential generations
- [ ] **Long text handling:** Often missing chunked processing — verify with 5000+ character texts
- [ ] **Voice management:** Often missing cleanup of orphaned audio files — verify that deleting a voice removes all associated files
- [ ] **Error handling:** Often missing graceful degradation — verify behavior when GPU is OOM, queue is full, model crashes
- [ ] **Download:** Often missing format conversion — verify MP3 and WAV download both work with correct sample rates
- [ ] **Batch processing:** Often missing partial failure handling — verify that one failed item in a batch doesn't kill the entire batch
- [ ] **SSML/Prosody:** Often missing validation — verify malformed SSML is rejected with clear errors, not silently ignored
- [ ] **Sharing:** Often missing expiration on shared links — verify shared audio links expire and can't be accessed indefinitely

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| GPU OOM / worker crash | LOW | Celery auto-restarts workers. Ensure model loads at startup. Implement `worker_max_tasks_per_child=50` to prevent accumulation. |
| Terrible voice cloning quality | MEDIUM | Add audio quality validation pipeline retroactively. Re-process existing voice samples if they meet new quality thresholds. Notify users whose voices don't meet standards. |
| Synchronous API blocking | HIGH | Full architectural refactor to async task pattern. Requires frontend changes (polling/websocket), backend changes (Celery integration), and API contract changes. Do not defer this. |
| Text normalization gaps | MEDIUM | Add preprocessing rules incrementally. Start with number expansion and HTML stripping. Build a test corpus of edge cases. |
| Celery task timeouts | LOW | Increase time limits and implement text chunking. Existing short-text generation continues working. |
| Legal/ethical issues with cloning | HIGH | Implement consent flow and watermarking. Requires policy changes, UI changes, and possibly legal review. Urgent if already launched. |
| Audio format mismatches | MEDIUM | Add proper resampling and format conversion layer. Re-process stored audio if format is wrong. |
| SSML parser bugs | MEDIUM | Replace custom parser with proper XML parser. Reduce supported SSML subset if needed. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| GPU memory leaks / OOM | Phase 1: Infrastructure | Run 100 sequential generations, verify GPU memory returns to baseline. Monitor `nvidia-smi` during stress test. |
| Sync inference blocking API | Phase 1: Infrastructure | Verify all TTS endpoints return immediately with a task ID. No endpoint takes > 1s to respond. |
| Celery task timeouts | Phase 1: Infrastructure | Submit a 3000-character text, verify it completes within soft limit. Verify `SoftTimeLimitExceeded` is caught. |
| Audio format mismatches | Phase 1: Core TTS | Generate audio, play in Chrome/Firefox/Safari. Download as MP3 and WAV, verify correct duration and pitch. |
| Text normalization failures | Phase 1: Core TTS | Test with corpus of 50+ adversarial inputs (URLs, numbers, abbreviations, emoji, mixed language). Verify no crashes. |
| Poor reference audio quality | Phase 2: Voice Cloning | Upload noisy, short, and low-quality samples — verify they are rejected with specific feedback. Upload good samples — verify high-quality output. |
| Voice cloning consent/ethics | Phase 2: Voice Cloning | Verify consent flow is required before cloning. Verify watermarking is present in output audio. |
| SSML parsing complexity | Phase 3: Prosody/SSML | Test with valid and invalid SSML. Verify malformed input is rejected with clear errors. Verify supported tags produce audible changes. |
| Batch/bulk failures | Phase 4: Batch Processing | Submit batch of 20 texts with one intentionally bad input. Verify 19 succeed and 1 fails gracefully with individual error. |
| Audio caching/re-generation | Phase 4: Performance | Submit identical generation request twice. Verify second returns cached result. Verify cache invalidation on parameter change. |

## Sources

- Qwen3-TTS official README and API documentation (Context7 verified) — https://github.com/QwenLM/Qwen3-TTS
- Coqui TTS voice cloning documentation (Context7 verified) — https://github.com/idiap/coqui-ai-TTS/blob/dev/docs/source/cloning.md
- Celery official documentation on task time limits and worker configuration (Context7 verified) — https://docs.celeryq.dev/en/stable/
- FastAPI StreamingResponse and BackgroundTasks documentation (Context7 verified) — https://fastapi.tiangolo.com/
- Coqui TTS ethical notice on voice cloning: "Voice cloning raises several ethical concerns and must not be used to impersonate individuals without their consent"
- Qwen3-TTS: supports `language="auto"` for adaptive language switching, requires `ref_text` for best ICL cloning quality
- Qwen3-TTS FlashAttention 2 requirement: `pip install -U flash-attn --no-build-isolation`, needs `torch.bfloat16` or `torch.float16`
- Qwen3-TTS model sizes: 0.6B and 1.7B variants, requiring significant GPU VRAM

---
*Pitfalls research for: TTS / Voice Cloning Web Application*
*Researched: 2026-04-25*
