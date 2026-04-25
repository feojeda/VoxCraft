// Shared TypeScript types matching backend Pydantic schemas

// Request types
export interface TTSRequest {
  text: string; // 1-50000 chars
  speaker: string; // e.g. "ryan", "serena"
  language?: string; // default "auto"
  speed?: number; // 0.5 - 2.0, default 1.0
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
  speaker: string;
  speed: number;
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

// API error type
export interface ApiError {
  detail: string;
  status_code: number;
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
