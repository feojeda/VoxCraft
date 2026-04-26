import type {
  TTSRequest,
  TTSJobResponse,
  JobStatusResponse,
  Speaker,
  VoiceResponse,
  ApiError,
  User,
  LoginRequest,
  RegisterRequest,
  HistoryListResponse,
  VoicePreset,
  BatchJob,
  BatchListResponse,
  ShareLink,
  ShareListResponse,
  SharePublicData,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

class ApiClientError extends Error {
  detail: string;
  statusCode: number;

  constructor(error: ApiError) {
    super(error.detail);
    this.name = "ApiClientError";
    this.detail = error.detail;
    this.statusCode = error.status_code;
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    let statusCode = response.status;

    try {
      const errorBody = (await response.json()) as ApiError;
      detail = errorBody.detail || detail;
      statusCode = errorBody.status_code || statusCode;
    } catch {
      // Use default error message if response body is not JSON
    }

    throw new ApiClientError({ detail, status_code: statusCode });
  }

  // For binary responses (ZIP downloads), return blob instead of JSON
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/zip")) {
    return response.blob() as Promise<T>;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  /** POST /api/auth/register — Create a new user account */
  register(credentials: RegisterRequest): Promise<User> {
    return request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  /** POST /api/auth/login — Authenticate and set JWT cookie */
  login(credentials: LoginRequest): Promise<User> {
    return request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  /** POST /api/auth/logout — Clear JWT cookie */
  logout(): Promise<void> {
    return request<void>("/auth/logout", { method: "POST" });
  },

  /** GET /api/auth/me — Get current user profile */
  me(): Promise<User> {
    return request<User>("/auth/me");
  },

  /** POST /api/generate — Create a TTS job */
  createTTSJob(ttsRequest: TTSRequest): Promise<TTSJobResponse> {
    return request<TTSJobResponse>("/generate", {
      method: "POST",
      body: JSON.stringify(ttsRequest),
    });
  },

  /** GET /api/jobs/{id} — Get job status */
  getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return request<JobStatusResponse>(`/jobs/${jobId}`);
  },

  /** GET /api/voices/predefined — Get available predefined speakers */
  getSpeakers(): Promise<{ speakers: Speaker[]; total: number }> {
    return request<{ speakers: Speaker[]; total: number }>("/voices/predefined");
  },

  /** POST /api/voices — Upload a cloned voice */
  uploadVoice(audioFile: File, refText: string, name: string): Promise<VoiceResponse> {
    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("ref_text", refText);
    formData.append("name", name);
    return request<VoiceResponse>("/voices", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    });
  },

  /** GET /api/voices — List cloned voices */
  listVoices(): Promise<{ voices: VoiceResponse[]; total: number }> {
    return request<{ voices: VoiceResponse[]; total: number }>("/voices");
  },

  /** PATCH /api/voices/{id} — Rename a cloned voice */
  updateVoice(voiceId: string, name: string): Promise<VoiceResponse> {
    return request<VoiceResponse>(`/voices/${voiceId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },

  /** DELETE /api/voices/{id} — Delete a cloned voice */
  deleteVoice(voiceId: string): Promise<void> {
    return request<void>(`/voices/${voiceId}`, {
      method: "DELETE",
    });
  },

  /** POST /api/pronunciation — Create pronunciation entry */
  createPronunciationEntry(word: string, replacement: string): Promise<{ id: string; word: string; replacement: string; created_at: string }> {
    return request<{ id: string; word: string; replacement: string; created_at: string }>("/pronunciation", {
      method: "POST",
      body: JSON.stringify({ word, replacement }),
    });
  },

  /** GET /api/pronunciation — List pronunciation entries */
  listPronunciationEntries(): Promise<{ entries: { id: string; word: string; replacement: string; created_at: string }[]; total: number }> {
    return request<{ entries: { id: string; word: string; replacement: string; created_at: string }[]; total: number }>("/pronunciation");
  },

  /** DELETE /api/pronunciation/{id} — Delete pronunciation entry */
  deletePronunciationEntry(entryId: string): Promise<void> {
    return request<void>(`/pronunciation/${entryId}`, {
      method: "DELETE",
    });
  },

  /** GET /api/history — List generation history */
  getHistory(skip?: number, limit?: number): Promise<HistoryListResponse> {
    const params = new URLSearchParams();
    if (skip !== undefined) params.set("skip", String(skip));
    if (limit !== undefined) params.set("limit", String(limit));
    const query = params.toString();
    return request<HistoryListResponse>(`/history${query ? `?${query}` : ""}`);
  },

  /** DELETE /api/history/{jobId} — Delete a history item */
  deleteHistoryItem(jobId: string): Promise<void> {
    return request<void>(`/history/${jobId}`, {
      method: "DELETE",
    });
  },

  /** GET /api/presets — List voice presets */
  getPresets(): Promise<{ presets: VoicePreset[]; total: number }> {
    return request<{ presets: VoicePreset[]; total: number }>("/presets");
  },

  /** POST /api/presets — Create a voice preset */
  createPreset(preset: {
    name: string;
    speed: number;
    emotion_preset: string | null;
    instruct: string | null;
  }): Promise<VoicePreset> {
    return request<VoicePreset>("/presets", {
      method: "POST",
      body: JSON.stringify(preset),
    });
  },

  /** DELETE /api/presets/{presetId} — Delete a voice preset */
  deletePreset(presetId: string): Promise<void> {
    return request<void>(`/presets/${presetId}`, {
      method: "DELETE",
    });
  },

  /** GET /api/batches — List user's batches */
  getBatches(skip?: number, limit?: number): Promise<BatchListResponse> {
    const params = new URLSearchParams();
    if (skip !== undefined) params.set("skip", String(skip));
    if (limit !== undefined) params.set("limit", String(limit));
    const query = params.toString();
    return request<BatchListResponse>(`/batches${query ? `?${query}` : ""}`);
  },

  /** POST /api/batches — Upload CSV for batch processing */
  uploadBatch(file: File, speed?: number, instruct?: string | null, emotionPreset?: string | null): Promise<BatchJob> {
    const formData = new FormData();
    formData.append("file", file);
    if (speed !== undefined) formData.append("speed", String(speed));
    if (instruct) formData.append("instruct", instruct);
    if (emotionPreset) formData.append("emotion_preset", emotionPreset);
    return request<BatchJob>("/batches", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    });
  },

  /** GET /api/batches/{batchId} — Get batch status and items */
  getBatch(batchId: string): Promise<BatchJob> {
    return request<BatchJob>(`/batches/${batchId}`);
  },

  /** GET /api/batches/{batchId}/download — Download ZIP */
  downloadBatchZip(batchId: string, format: "mp3" | "both" = "mp3"): Promise<Blob> {
    return request<Blob>(`/batches/${batchId}/download?format=${format}`, {
      headers: { Accept: "application/zip" },
    });
  },

  /** POST /api/shares — Create a share link */
  createShare(jobId: string, expiresAt?: string | null): Promise<ShareLink> {
    return request<ShareLink>("/shares", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId, expires_at: expiresAt }),
    });
  },

  /** GET /api/shares — List user's share links */
  getShares(): Promise<ShareListResponse> {
    return request<ShareListResponse>("/shares");
  },

  /** DELETE /api/shares/{shareId} — Revoke a share link */
  revokeShare(shareId: string): Promise<void> {
    return request<void>(`/shares/${shareId}`, { method: "DELETE" });
  },

  /** GET /api/shares/public/{token} — Get public share data */
  getPublicShare(token: string): Promise<SharePublicData> {
    return request<SharePublicData>(`/shares/public/${token}`);
  },
};

export { ApiClientError };
