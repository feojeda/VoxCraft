import type {
  TTSRequest,
  TTSJobResponse,
  JobStatusResponse,
  Speaker,
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

  /** GET /api/voices — Get available speakers */
  getSpeakers(): Promise<Speaker[]> {
    return request<Speaker[]>("/voices");
  },
};

export { ApiClientError };
