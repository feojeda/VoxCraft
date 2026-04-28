# Graph Report - .  (2026-04-26)

## Corpus Check
- Corpus is ~28,589 words - fits in a single context window. You may not need a graph.

## Summary
- 639 nodes · 1075 edges · 92 communities detected
- Extraction: 56% EXTRACTED · 44% INFERRED · 0% AMBIGUOUS · INFERRED: 470 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_TTS Engine & Workers|TTS Engine & Workers]]
- [[_COMMUNITY_Batch Processing & Jobs|Batch Processing & Jobs]]
- [[_COMMUNITY_Audio Serving & Sharing|Audio Serving & Sharing]]
- [[_COMMUNITY_Authentication|Authentication]]
- [[_COMMUNITY_Voice Management|Voice Management]]
- [[_COMMUNITY_Batch API & Module Init|Batch API & Module Init]]
- [[_COMMUNITY_Frontend TTS Components|Frontend TTS Components]]
- [[_COMMUNITY_Pronunciation Dictionary|Pronunciation Dictionary]]
- [[_COMMUNITY_TTS Generation API|TTS Generation API]]
- [[_COMMUNITY_Database Migrations & Batch UI|Database Migrations & Batch UI]]
- [[_COMMUNITY_Voice Presets|Voice Presets]]
- [[_COMMUNITY_Database Core & Alembic|Database Core & Alembic]]
- [[_COMMUNITY_Config & Dependencies|Config & Dependencies]]
- [[_COMMUNITY_Audio Processing Service|Audio Processing Service]]
- [[_COMMUNITY_Exception Hierarchy|Exception Hierarchy]]
- [[_COMMUNITY_Health Checks & Celery|Health Checks & Celery]]
- [[_COMMUNITY_Frontend Auth Client|Frontend Auth Client]]
- [[_COMMUNITY_Frontend List Pages|Frontend List Pages]]
- [[_COMMUNITY_App Entry Points|App Entry Points]]
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Account Page|Account Page]]
- [[_COMMUNITY_Alembic Environment|Alembic Environment]]
- [[_COMMUNITY_Voice Recorder Component|Voice Recorder Component]]
- [[_COMMUNITY_Voice Manager Component|Voice Manager Component]]
- [[_COMMUNITY_API Client Core|API Client Core]]
- [[_COMMUNITY_Share Types|Share Types]]
- [[_COMMUNITY_Voice Types|Voice Types]]
- [[_COMMUNITY_React Providers|React Providers]]
- [[_COMMUNITY_Layout Module|Layout Module]]
- [[_COMMUNITY_Batch Types|Batch Types]]
- [[_COMMUNITY_Voice Types|Voice Types]]
- [[_COMMUNITY_Audio Types|Audio Types]]
- [[_COMMUNITY_Error Handling|Error Handling]]
- [[_COMMUNITY_Voice Uploader|Voice Uploader]]
- [[_COMMUNITY_Voice Types|Voice Types]]
- [[_COMMUNITY_Job Types|Job Types]]
- [[_COMMUNITY_Requirements Module|Requirements Module]]
- [[_COMMUNITY_Requirements Module|Requirements Module]]
- [[_COMMUNITY_Frontend Component|Frontend Component]]
- [[_COMMUNITY_Frontend Component|Frontend Component]]
- [[_COMMUNITY_Frontend Component|Frontend Component]]
- [[_COMMUNITY_Frontend Component|Frontend Component]]
- [[_COMMUNITY_Frontend Component|Frontend Component]]
- [[_COMMUNITY_Frontend Component|Frontend Component]]
- [[_COMMUNITY_Frontend Component|Frontend Component]]
- [[_COMMUNITY_Frontend Component|Frontend Component]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Backend Module|Backend Module]]
- [[_COMMUNITY_Backend Module|Backend Module]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Navigation|Navigation]]
- [[_COMMUNITY_Deps Module|Deps Module]]
- [[_COMMUNITY_Model Module|Model Module]]
- [[_COMMUNITY_Job Types|Job Types]]
- [[_COMMUNITY_Audio Types|Audio Types]]
- [[_COMMUNITY_Audio Types|Audio Types]]
- [[_COMMUNITY_Audio Types|Audio Types]]
- [[_COMMUNITY_Batch Types|Batch Types]]
- [[_COMMUNITY_Batch Types|Batch Types]]
- [[_COMMUNITY_Share Types|Share Types]]
- [[_COMMUNITY_Share Types|Share Types]]
- [[_COMMUNITY_Share Types|Share Types]]
- [[_COMMUNITY_Database Module|Database Module]]
- [[_COMMUNITY_Model Module|Model Module]]
- [[_COMMUNITY_Qwen Module|Qwen Module]]
- [[_COMMUNITY_Qwen Module|Qwen Module]]
- [[_COMMUNITY_Qwen Module|Qwen Module]]
- [[_COMMUNITY_Qwen Module|Qwen Module]]
- [[_COMMUNITY_Voice Types|Voice Types]]
- [[_COMMUNITY_Tts Module|Tts Module]]
- [[_COMMUNITY_Layout Module|Layout Module]]
- [[_COMMUNITY_Page Component|Page Component]]
- [[_COMMUNITY_Page Component|Page Component]]
- [[_COMMUNITY_Page Component|Page Component]]
- [[_COMMUNITY_Middleware|Middleware]]
- [[_COMMUNITY_Page Component|Page Component]]
- [[_COMMUNITY_Page Component|Page Component]]
- [[_COMMUNITY_Agents Module|Agents Module]]
- [[_COMMUNITY_Agents Module|Agents Module]]
- [[_COMMUNITY_Agents Module|Agents Module]]
- [[_COMMUNITY_Agents Module|Agents Module]]
- [[_COMMUNITY_Agents Module|Agents Module]]
- [[_COMMUNITY_Agents Module|Agents Module]]
- [[_COMMUNITY_Agents Module|Agents Module]]
- [[_COMMUNITY_Alembic Config|Alembic Config]]
- [[_COMMUNITY_Requirements Module|Requirements Module]]
- [[_COMMUNITY_Requirements Module|Requirements Module]]
- [[_COMMUNITY_Requirements Module|Requirements Module]]
- [[_COMMUNITY_Requirements Module|Requirements Module]]

## God Nodes (most connected - your core abstractions)
1. `User` - 58 edges
2. `Job` - 37 edges
3. `ClonedVoice` - 31 edges
4. `Base` - 29 edges
5. `TTS engine abstraction layer.  Re-exports the public engine API: base classes, m` - 28 edges
6. `JobStatusResponse` - 21 edges
7. `QwenTTSEngine` - 19 edges
8. `BatchJob` - 18 edges
9. `SynthesisResult` - 17 edges
10. `PronunciationDict` - 16 edges

## Surprising Connections (you probably didn't know these)
- `User` --semantically_similar_to--> `User (TypeScript)`  [INFERRED] [semantically similar]
  backend/app/models/user.py → frontend/src/lib/types.ts
- `PronunciationDict` --semantically_similar_to--> `PronunciationEntry`  [INFERRED] [semantically similar]
  backend/app/models/pronunciation.py → frontend/src/lib/types.ts
- `Job` --semantically_similar_to--> `JobStatusResponse`  [INFERRED] [semantically similar]
  backend/app/models/job.py → frontend/src/lib/types.ts
- `BatchJob` --semantically_similar_to--> `BatchJob (TypeScript)`  [INFERRED] [semantically similar]
  backend/app/models/batch.py → frontend/src/lib/types.ts
- `VoicePreset` --semantically_similar_to--> `VoicePreset (TypeScript)`  [INFERRED] [semantically similar]
  backend/app/models/preset.py → frontend/src/lib/types.ts

## Hyperedges (group relationships)
- **Speech Parameter Controls** — prosodyinput_prosodyinput, speed_slider_speedslider, emotionselector_emotionselector, pronunciationdict_pronunciationdict [INFERRED 0.85]
- **Generation Result Display** — audio_player_audioplayer, download_buttons_downloadbuttons, share_button_sharebutton, progress_bar_progressbar, empty_state_emptystate [INFERRED 0.85]
- **Voice Clone Input Sources** — voice_clone_input_voicecloneinput, voiceuploader_voiceuploader, voicerecorder_voicerecorder [INFERRED 0.90]
- **JWT Cookie Authentication Flow** — auth_register, auth_login, auth_logout, auth_me, auth_set_auth_cookie, auth_clear_auth_cookie [INFERRED 0.85]
- **Public Share Audio Access** — audio_serve_shared_wav, audio_serve_shared_mp3, share_get_public_share [INFERRED 0.80]
- **TTS Voice Configuration Schemas** — tts_ttsrequest, generation_generationrequest, preset_voicepresetcreaterequest [INFERRED 0.75]
- **SQLAlchemy Declarative Model Layer** — database_base, user_user, job_job, batch_batchjob, pronunciation_pronunciationdict, preset_voicepreset, voice_clonedvoice, share_sharelink [EXTRACTED 1.00]
- **Backend Service Singleton Pattern** — job_manager_job_manager, audio_service_audio_service, batch_service_batch_service, share_service_share_service [INFERRED 0.85]
- **Frontend Authentication Flow** — auth_context_authprovider, auth_context_useauth, api_client_apiclient, api_client_request [INFERRED 0.80]
- **QwenTTSEngine Synthesis Methods** — qwen_synthesize, qwen_synthesize_voice_clone, qwen_synthesize_voice_design [INFERRED 0.85]
- **TTS Engine Abstraction and Factory** — base_basettsengine, qwen_qwenttsengine, model_manager_modelmanager [INFERRED 0.85]
- **Next.js Application Pages** — page_home, page_registerpage, page_voicespage, page_historypage [INFERRED 0.80]
- **Async Alembic migration execution flow** — env_runmigrationsonline, env_runasyncmigrations, env_dorunmigrations, env_runmigrationsoffline [EXTRACTED 1.00]
- **Authentication user flow pages** — account_page_accountpage, login_page_loginpage, account_page_handlelogout, login_page_handlesubmit [INFERRED 0.75]
- **Batch processing UI** — batches_page_batchespage, batchid_page_batchdetailpage, batches_page_handleuploadcomplete, batchid_page_handledownloadzip [INFERRED 0.80]

## Communities

### Community 0 - "TTS Engine & Workers"
Cohesion: 0.05
Nodes (52): ABC, BaseTTSEngine, Abstract TTS engine interface.  Defines the contract that all TTS engine adapter, Result of a single TTS synthesis operation.      Attributes:         audio: Raw, Abstract base class for TTS engine adapters.      Subclasses must implement synt, SynthesisResult, BaseTTSEngine, Celery Application (+44 more)

### Community 1 - "Batch Processing & Jobs"
Cohesion: 0.06
Nodes (44): BatchJob, Represents a batch of TTS generation jobs submitted together., BatchService, create_batch, generate_zip, parse_csv_rows(), Batch processing service for CSV upload and ZIP generation.  Handles the full ba, Create a batch job and individual jobs for each CSV row.          Invalid rows a (+36 more)

### Community 2 - "Audio Serving & Sharing"
Cohesion: 0.08
Nodes (44): Audio file serving endpoints.  GET /api/audio/{job_id}/wav — Serve WAV audio fil, Serve MP3 audio for a public share link (no auth required)., Serve the WAV audio file for a completed job.      Returns 404 if the job doesn', Serve the MP3 audio file for a completed job.      Returns 404 if the job doesn', Serve WAV audio for a public share link (no auth required)., serve_mp3(), serve_shared_mp3(), serve_shared_wav() (+36 more)

### Community 3 - "Authentication"
Cohesion: 0.09
Nodes (36): _clear_auth_cookie(), login(), LoginRequest, logout(), me(), Authentication REST endpoints.  Provides user registration, login (via httpOnly, Clear the auth cookie and log out., Request body for user registration. (+28 more)

### Community 4 - "Voice Management"
Cohesion: 0.12
Nodes (34): AudioValidationError, _calculate_dbfs(), Audio file validation service for voice cloning uploads.  Validates uploaded aud, Raised when an audio file fails validation for voice cloning., Calculate average dBFS of an audio signal.      Args:         audio: Audio sampl, Validate an uploaded audio file for voice cloning.      Checks format, duration,, validate_audio_file(), Rationale: validate format/duration/quality before voice cloning (+26 more)

### Community 5 - "Batch API & Module Init"
Cohesion: 0.11
Nodes (26): JWT token response (used internally; cookie is preferred)., TokenResponse, BaseModel, BatchDownloadRequest, BatchItemResponse, BatchListItem, BatchListResponse, BatchResponse (+18 more)

### Community 6 - "Frontend TTS Components"
Cohesion: 0.1
Nodes (20): AudioPlayer, BatchUpload, DownloadButtons, EmotionSelector(), EmptyState(), GenerateButton(), ModeSelector, ProgressBar (+12 more)

### Community 7 - "Pronunciation Dictionary"
Cohesion: 0.15
Nodes (22): apply_pronunciation_dict(), apply_pronunciation_to_text(), create_entry(), delete_entry(), get_pronunciation_entries(), list_entries(), PronunciationDict, PronunciationEntryRequest (+14 more)

### Community 8 - "TTS Generation API"
Cohesion: 0.11
Nodes (19): GenerationRequest, Pydantic schemas for generation requests with Phase 2 features.  Extends the bas, Request body for creating a new TTS generation job (Phase 2).      Supports both, Job-related Pydantic schemas.  Re-exports TTS job schemas for convenient importi, SPEAKERS catalog, Phase 2 extends base TTS request, 50000 char limit per threat model T-01-01, Three TTS modes for different voice sources (+11 more)

### Community 9 - "Database Migrations & Batch UI"
Cohesion: 0.1
Nodes (21): cloned_voices table, downgrade(), pronunciation_dict table, Add cloned voices and pronunciation tables.  Revision ID: 002 Revises: Create Da, Create cloned_voices and pronunciation_dict tables., Drop cloned_voices and pronunciation_dict tables., upgrade(), BatchesPage (+13 more)

### Community 10 - "Voice Presets"
Cohesion: 0.17
Nodes (18): Base, Pydantic schemas for voice preset requests and responses., Request body for creating a voice preset., Represents a saved voice setting preset for quick recall., Public voice preset response., Paginated list of voice presets., VoicePreset, VoicePresetCreateRequest (+10 more)

### Community 11 - "Database Core & Alembic"
Cohesion: 0.11
Nodes (19): Base, get_db(), init_db(), Async SQLAlchemy database setup.  Provides async session factory, declarative ba, Declarative base for all SQLAlchemy models., FastAPI dependency that yields an async database session.      The session is au, Create all database tables (for development without Alembic).      In production, DeclarativeBase (+11 more)

### Community 12 - "Config & Dependencies"
Cohesion: 0.19
Nodes (11): BaseSettings, Application configuration via environment variables.  Uses pydantic-settings to, Application settings loaded from environment variables.      All values can be o, Settings, get_current_user(), get_settings(), FastAPI dependency injection functions.  Provides reusable dependencies for data, Return a cached Settings instance.      Uses lru_cache to avoid re-parsing envir (+3 more)

### Community 13 - "Audio Processing Service"
Cohesion: 0.19
Nodes (8): AudioService, Audio file management service.  Handles saving WAV files from numpy arrays, conv, Manages audio file I/O: WAV saving, MP3 conversion, and path resolution., Initialize with output directory from settings., Create the audio output directory if it doesn't exist.          Returns:, Get the expected file path for a job's audio output.          Args:, Save a numpy audio array as a WAV file.          Args:             audio: Audio, Convert a WAV file to MP3 using FFmpeg.          Uses libmp3lame with VBR qualit

### Community 14 - "Exception Hierarchy"
Cohesion: 0.21
Nodes (12): Exception, AudioValidationError, ConfigError, EngineLoadError, Custom exception hierarchy for ttsQwen.  All domain-specific exceptions inherit, Raised when the TTS engine fails to load a model., Raised when audio synthesis fails., Raised when an audio file fails validation. (+4 more)

### Community 15 - "Health Checks & Celery"
Cohesion: 0.18
Nodes (9): ping(), Celery application configuration for ttsQwen.  Configures the Celery worker with, Simple ping task for testing Celery connectivity., health_check(), health_detail(), Health check endpoint.  Provides a simple health endpoint for load balancers and, Basic health check — returns API status and version., Detailed health check including Redis and Celery worker status.      Checks: (+1 more)

### Community 16 - "Frontend Auth Client"
Cohesion: 0.22
Nodes (8): apiClient, apiClient.login, apiClient.logout, apiClient.me, apiClient.register, AuthProvider(), TTSRequest, User (TypeScript)

### Community 17 - "Frontend List Pages"
Cohesion: 0.29
Nodes (2): handleUploadComplete(), StatusBadge()

### Community 18 - "App Entry Points"
Cohesion: 0.29
Nodes (6): FastAPI Application Instance, lifespan(), FastAPI application entry point.  Configures CORS middleware, includes API route, Application lifespan: runs startup/shutdown logic., Next.js Configuration, Rationale: CORS Restrict Origins per Threat Model

### Community 19 - "Home Page"
Cohesion: 0.33
Nodes (0): 

### Community 20 - "Account Page"
Cohesion: 0.33
Nodes (6): AccountPage, handleLogout, revokeMutation, handleSubmit, LoginPage, validateEmail

### Community 21 - "Alembic Environment"
Cohesion: 0.33
Nodes (6): do_run_migrations, Rationale: async migration runner using app's database engine, run_async_migrations, run_migrations_online, Rationale: database with async support, SQLAlchemy and Alembic

### Community 22 - "Voice Recorder Component"
Cohesion: 0.5
Nodes (2): handleUpload(), resetRecording()

### Community 23 - "Voice Manager Component"
Cohesion: 0.5
Nodes (0): 

### Community 24 - "API Client Core"
Cohesion: 0.5
Nodes (1): ApiClientError

### Community 25 - "Share Types"
Cohesion: 0.67
Nodes (0): 

### Community 26 - "Voice Types"
Cohesion: 0.67
Nodes (0): 

### Community 27 - "React Providers"
Cohesion: 0.67
Nodes (2): Providers(), Rationale: 30 second staleTime for job status polling

### Community 28 - "Layout Module"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Batch Types"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Voice Types"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Audio Types"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Error Handling"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Voice Uploader"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Voice Types"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Job Types"
Cohesion: 1.0
Nodes (2): complete_job, fail_job

### Community 36 - "Requirements Module"
Cohesion: 1.0
Nodes (2): Celery and Redis, Rationale: task queue for async processing

### Community 37 - "Requirements Module"
Cohesion: 1.0
Nodes (2): httpx and soundfile, Rationale: TTS engine runs on external server via HTTP

### Community 38 - "Frontend Component"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Frontend Component"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Frontend Component"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Frontend Component"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Frontend Component"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Frontend Component"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Frontend Component"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Frontend Component"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): Ensure exactly one voice source is provided.

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): Ensure emotion_preset is a valid value.

### Community 48 - "Backend Module"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Backend Module"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): Synthesize speech from text.          Args:             text: The text to conver

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): Return list of available speakers.          Returns:             List of dicts w

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): Return list of supported language names.          Returns:             List of l

### Community 53 - "Navigation"
Cohesion: 1.0
Nodes (1): TopNav

### Community 54 - "Deps Module"
Cohesion: 1.0
Nodes (1): get_db dependency

### Community 55 - "Model Module"
Cohesion: 1.0
Nodes (1): VALID_SPEAKER_IDS

### Community 56 - "Job Types"
Cohesion: 1.0
Nodes (1): update_job_status

### Community 57 - "Audio Types"
Cohesion: 1.0
Nodes (1): save_wav

### Community 58 - "Audio Types"
Cohesion: 1.0
Nodes (1): convert_to_mp3

### Community 59 - "Audio Types"
Cohesion: 1.0
Nodes (1): audio_service singleton

### Community 60 - "Batch Types"
Cohesion: 1.0
Nodes (1): get_batch_with_items

### Community 61 - "Batch Types"
Cohesion: 1.0
Nodes (1): list_batches

### Community 62 - "Share Types"
Cohesion: 1.0
Nodes (1): get_share_by_token

### Community 63 - "Share Types"
Cohesion: 1.0
Nodes (1): revoke_share

### Community 64 - "Share Types"
Cohesion: 1.0
Nodes (1): list_shares

### Community 65 - "Database Module"
Cohesion: 1.0
Nodes (1): async_session_factory

### Community 66 - "Model Module"
Cohesion: 1.0
Nodes (1): Supported Languages List

### Community 67 - "Qwen Module"
Cohesion: 1.0
Nodes (1): Emotion Preset Mappings

### Community 68 - "Qwen Module"
Cohesion: 1.0
Nodes (1): Call TTS HTTP Endpoint

### Community 69 - "Qwen Module"
Cohesion: 1.0
Nodes (1): Get Predefined Speakers

### Community 70 - "Qwen Module"
Cohesion: 1.0
Nodes (1): Get Supported Languages

### Community 71 - "Voice Types"
Cohesion: 1.0
Nodes (1): Voice Clone Async Runner

### Community 72 - "Tts Module"
Cohesion: 1.0
Nodes (1): TTS Generate Async Runner

### Community 73 - "Layout Module"
Cohesion: 1.0
Nodes (1): Root Layout Metadata

### Community 74 - "Page Component"
Cohesion: 1.0
Nodes (1): Home Page Generate Handler

### Community 75 - "Page Component"
Cohesion: 1.0
Nodes (1): Home Page Mode Change Handler

### Community 76 - "Page Component"
Cohesion: 1.0
Nodes (1): Home Page Generate Disabled Check

### Community 77 - "Middleware"
Cohesion: 1.0
Nodes (1): Public Routes Set

### Community 78 - "Page Component"
Cohesion: 1.0
Nodes (1): Load Voices Handler

### Community 79 - "Page Component"
Cohesion: 1.0
Nodes (1): History Card Component

### Community 80 - "Agents Module"
Cohesion: 1.0
Nodes (1): ttsQwen Project Description

### Community 81 - "Agents Module"
Cohesion: 1.0
Nodes (1): Frontend React/Next.js Constraint

### Community 82 - "Agents Module"
Cohesion: 1.0
Nodes (1): Backend FastAPI Constraint

### Community 83 - "Agents Module"
Cohesion: 1.0
Nodes (1): Celery Redis Workers Constraint

### Community 84 - "Agents Module"
Cohesion: 1.0
Nodes (1): SQLite Database Constraint

### Community 85 - "Agents Module"
Cohesion: 1.0
Nodes (1): Separated Architecture Constraint

### Community 86 - "Agents Module"
Cohesion: 1.0
Nodes (1): GPU Requirement Constraint

### Community 87 - "Alembic Config"
Cohesion: 1.0
Nodes (1): run_migrations_offline

### Community 88 - "Requirements Module"
Cohesion: 1.0
Nodes (1): FastAPI and uvicorn

### Community 89 - "Requirements Module"
Cohesion: 1.0
Nodes (1): Pydantic and pydantic-settings

### Community 90 - "Requirements Module"
Cohesion: 1.0
Nodes (1): passlib and python-jose

### Community 91 - "Requirements Module"
Cohesion: 1.0
Nodes (1): pytest, pytest-asyncio, ruff

## Knowledge Gaps
- **176 isolated node(s):** `Application configuration via environment variables.  Uses pydantic-settings to`, `Application settings loaded from environment variables.      All values can be o`, `FastAPI application entry point.  Configures CORS middleware, includes API route`, `Application lifespan: runs startup/shutdown logic.`, `Async SQLAlchemy database setup.  Provides async session factory, declarative ba` (+171 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Layout Module`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Batch Types`** (2 nodes): `validateFile()`, `batch-upload.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Voice Types`** (2 nodes): `voice-picker.tsx`, `scroll()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Audio Types`** (2 nodes): `formatTime()`, `audio-player.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Error Handling`** (2 nodes): `ErrorMessage()`, `error-message.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Voice Uploader`** (2 nodes): `VoiceUploader.tsx`, `handleUpload()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Voice Types`** (2 nodes): `voice-clone-input.tsx`, `handleFileChange()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Job Types`** (2 nodes): `complete_job`, `fail_job`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Requirements Module`** (2 nodes): `Celery and Redis`, `Rationale: task queue for async processing`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Requirements Module`** (2 nodes): `httpx and soundfile`, `Rationale: TTS engine runs on external server via HTTP`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Component`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Component`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Component`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Component`** (1 nodes): `ProsodyInput.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Component`** (1 nodes): `download-buttons.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Component`** (1 nodes): `progress-bar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Component`** (1 nodes): `mode-selector.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Component`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `Ensure exactly one voice source is provided.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `Ensure emotion_preset is a valid value.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Module`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Module`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `Synthesize speech from text.          Args:             text: The text to conver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `Return list of available speakers.          Returns:             List of dicts w`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `Return list of supported language names.          Returns:             List of l`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Navigation`** (1 nodes): `TopNav`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Deps Module`** (1 nodes): `get_db dependency`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Model Module`** (1 nodes): `VALID_SPEAKER_IDS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Job Types`** (1 nodes): `update_job_status`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Audio Types`** (1 nodes): `save_wav`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Audio Types`** (1 nodes): `convert_to_mp3`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Audio Types`** (1 nodes): `audio_service singleton`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Batch Types`** (1 nodes): `get_batch_with_items`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Batch Types`** (1 nodes): `list_batches`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Share Types`** (1 nodes): `get_share_by_token`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Share Types`** (1 nodes): `revoke_share`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Share Types`** (1 nodes): `list_shares`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Module`** (1 nodes): `async_session_factory`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Model Module`** (1 nodes): `Supported Languages List`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Qwen Module`** (1 nodes): `Emotion Preset Mappings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Qwen Module`** (1 nodes): `Call TTS HTTP Endpoint`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Qwen Module`** (1 nodes): `Get Predefined Speakers`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Qwen Module`** (1 nodes): `Get Supported Languages`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Voice Types`** (1 nodes): `Voice Clone Async Runner`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tts Module`** (1 nodes): `TTS Generate Async Runner`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Layout Module`** (1 nodes): `Root Layout Metadata`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Component`** (1 nodes): `Home Page Generate Handler`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Component`** (1 nodes): `Home Page Mode Change Handler`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Component`** (1 nodes): `Home Page Generate Disabled Check`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Middleware`** (1 nodes): `Public Routes Set`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Component`** (1 nodes): `Load Voices Handler`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Component`** (1 nodes): `History Card Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agents Module`** (1 nodes): `ttsQwen Project Description`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agents Module`** (1 nodes): `Frontend React/Next.js Constraint`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agents Module`** (1 nodes): `Backend FastAPI Constraint`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agents Module`** (1 nodes): `Celery Redis Workers Constraint`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agents Module`** (1 nodes): `SQLite Database Constraint`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agents Module`** (1 nodes): `Separated Architecture Constraint`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agents Module`** (1 nodes): `GPU Requirement Constraint`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Alembic Config`** (1 nodes): `run_migrations_offline`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Requirements Module`** (1 nodes): `FastAPI and uvicorn`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Requirements Module`** (1 nodes): `Pydantic and pydantic-settings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Requirements Module`** (1 nodes): `passlib and python-jose`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Requirements Module`** (1 nodes): `pytest, pytest-asyncio, ruff`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Authentication` to `Batch Processing & Jobs`, `Audio Serving & Sharing`, `Voice Management`, `Batch API & Module Init`, `Pronunciation Dictionary`, `TTS Generation API`, `Voice Presets`, `Database Core & Alembic`, `Config & Dependencies`, `Frontend Auth Client`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Why does `TTS engine abstraction layer.  Re-exports the public engine API: base classes, m` connect `Batch API & Module Init` to `TTS Engine & Workers`, `Batch Processing & Jobs`, `Audio Serving & Sharing`, `Authentication`, `Voice Management`, `Pronunciation Dictionary`, `Voice Presets`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `Job` connect `Batch Processing & Jobs` to `TTS Engine & Workers`, `Audio Serving & Sharing`, `Batch API & Module Init`, `TTS Generation API`, `Voice Presets`, `Database Core & Alembic`, `Audio Processing Service`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Are the 54 inferred relationships involving `User` (e.g. with `Base` and `TTS engine abstraction layer.  Re-exports the public engine API: base classes, m`) actually correct?**
  _`User` has 54 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `Job` (e.g. with `Base` and `TTS engine abstraction layer.  Re-exports the public engine API: base classes, m`) actually correct?**
  _`Job` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 27 inferred relationships involving `ClonedVoice` (e.g. with `TTS engine abstraction layer.  Re-exports the public engine API: base classes, m` and `Base`) actually correct?**
  _`ClonedVoice` has 27 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `Base` (e.g. with `User` and `User database model.  Stores registered user accounts with bcrypt-hashed passwor`) actually correct?**
  _`Base` has 26 INFERRED edges - model-reasoned connections that need verification._