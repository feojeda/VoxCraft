import type {
  TTSRequest,
  TTSJobResponse,
  JobStatusResponse,
  Speaker,
  VoiceResponse,
  ApiError,
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

  return response.json() as Promise<T>;
}

export const apiClient = {
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
};

export { ApiClientError };
