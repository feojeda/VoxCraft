// Shared TypeScript types matching backend Pydantic schemas

// TTS mode
export type TTSMode = "speech" | "voice-design" | "voice-clone";

// Request types
export interface TTSRequest {
  text: string; // 1-50000 chars
  mode: TTSMode; // speech | voice-design | voice-clone
  speaker?: string; // for speech mode, e.g. "ryan", "serena"
  cloned_voice_id?: string; // use persisted cloned voice
  language?: string; // default "auto"
  speed?: number; // 0.5 - 2.0, default 1.0
  instruct?: string; // for speech mode
  instructions?: string; // for voice-design mode
  ref_audio?: string; // for voice-clone mode
  ref_text?: string; // for voice-clone mode
  emotion_preset?: string; // happy, sad, angry, neutral, whisper
  pronunciation_enabled?: boolean; // default false
}

export interface PronunciationEntry {
  id: string;
  word: string;
  replacement: string;
}

// Response types
export interface TTSJobResponse {
  job_id: string;
  status: string;
}

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progress: number; // 0-100
  audio_wav_url: string | null;
  audio_mp3_url: string | null;
  error_message: string | null;
  mode: TTSMode;
  speaker: string | null;
  speed: number;
  instructions: string | null;
  created_at: string;
}

// Speaker/Voice types
export interface Speaker {
  id: string; // e.g. "ryan"
  name: string; // e.g. "Ryan"
  language: string; // e.g. "English"
  gender: string; // e.g. "Male"
  description: string; // e.g. "Clear and professional"
}

// Cloned voice response
export interface VoiceResponse {
  id: string;
  name: string;
  audio_path: string;
  ref_text: string;
  duration_seconds: number;
  sample_rate: number;
  created_at: string;
}

// API error type
export interface ApiError {
  detail: string;
  status_code: number;
}

// Auth types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

// History types
export interface HistoryItem {
  id: string;
  text: string;
  voice_name: string | null;
  status: JobStatus;
  mode: TTSMode;
  speed: number;
  created_at: string;
  completed_at: string | null;
  audio_wav_url: string | null;
  audio_mp3_url: string | null;
  error_message: string | null;
}

export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
}

// Preset types
export interface VoicePreset {
  id: string;
  name: string;
  speed: number;
  emotion_preset: string | null;
  instruct: string | null;
  created_at: string;
}

// Batch types
export interface BatchItem {
  job_id: string;
  text: string;
  voice_name: string | null;
  status: JobStatus;
  error_message: string | null;
  audio_wav_url: string | null;
  audio_mp3_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface BatchJob {
  id: string;
  status: JobStatus;
  total_items: number;
  completed_count: number;
  failed_count: number;
  created_at: string;
  completed_at: string | null;
  items: BatchItem[];
}

export interface BatchListResponse {
  items: Omit<BatchJob, "items">[];
  total: number;
}

// Share types
export interface ShareLink {
  id: string;
  token: string;
  job_id: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  is_active: boolean;
  share_url: string;
}

export interface ShareListResponse {
  items: ShareLink[];
  total: number;
}

export interface SharePublicData {
  token: string;
  text: string;
  voice_name: string | null;
  audio_wav_url: string | null;
  audio_mp3_url: string | null;
  created_at: string;
}

// Predefined Qwen3-TTS CustomVoice speakers (from research F-01)
export const PREDEFINED_SPEAKERS: Speaker[] = [
  {
    id: "vivian",
    name: "Vivian",
    language: "Chinese",
    gender: "Female",
    description: "Warm and expressive",
  },
  {
    id: "serena",
    name: "Serena",
    language: "English",
    gender: "Female",
    description: "Clear and natural",
  },
  {
    id: "ryan",
    name: "Ryan",
    language: "English",
    gender: "Male",
    description: "Professional and warm",
  },
  {
    id: "aiden",
    name: "Aiden",
    language: "English",
    gender: "Male",
    description: "Young and energetic",
  },
  {
    id: "dylan",
    name: "Dylan",
    language: "English",
    gender: "Male",
    description: "Deep and resonant",
  },
  {
    id: "eric",
    name: "Eric",
    language: "English",
    gender: "Male",
    description: "Calm and authoritative",
  },
  {
    id: "ono_anna",
    name: "Anna",
    language: "Japanese",
    gender: "Female",
    description: "Gentle and precise",
  },
  {
    id: "sohee",
    name: "Sohee",
    language: "Korean",
    gender: "Female",
    description: "Bright and friendly",
  },
  {
    id: "uncle_fu",
    name: "Uncle Fu",
    language: "Chinese",
    gender: "Male",
    description: "Wise and experienced",
  },
];
