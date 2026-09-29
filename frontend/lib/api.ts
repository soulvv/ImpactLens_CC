import {
  Project,
  MediaItem,
  MediaDetail,
  Activity,
  DashboardData,
  HealthStatus,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Normalizes media URL: if it's a relative URL from local sandbox storage,
 * prepend the backend API base URL so the browser can load it.
 */
export function getMediaAssetUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  // Relative URL (e.g. /static/uploads/...)
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      let errorMsg = `API Error ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorMsg = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("An unexpected network error occurred while communicating with the intelligence service.");
  }
}

export const api = {
  // Health
  getHealth: () => fetchJson<HealthStatus>("/health"),

  // Dashboard
  getDashboardStats: () => fetchJson<DashboardData>("/api/dashboard/stats"),

  // Media
  getMedia: (params?: {
    project_id?: string;
    media_type?: string;
    status?: string;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.project_id && params.project_id !== "all") q.set("project_id", params.project_id);
    if (params?.media_type && params.media_type !== "all") q.set("media_type", params.media_type);
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    const qs = q.toString();
    return fetchJson<MediaItem[]>(`/api/media${qs ? `?${qs}` : ""}`);
  },

  getMediaById: (id: string) => fetchJson<MediaDetail>(`/api/media/${id}`),

  uploadMedia: async (
    file: File,
    projectId?: string,
    onProgress?: (percent: number) => void
  ): Promise<MediaItem> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);
      if (projectId && projectId !== "unassigned") {
        formData.append("project_id", projectId);
      }

      xhr.open("POST", `${API_BASE_URL}/api/media/upload`);
      xhr.setRequestHeader("Accept", "application/json");

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res);
          } catch {
            reject(new Error("Failed to parse server upload response."));
          }
        } else {
          let errorMsg = `Upload failed with status ${xhr.status}`;
          try {
            const err = JSON.parse(xhr.responseText);
            if (err.detail) errorMsg = err.detail;
          } catch {
            // fallback
          }
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network connection error during media ingestion."));
      };

      xhr.send(formData);
    });
  },

  deleteMedia: (id: string) =>
    fetchJson<{ status: string; message: string }>(`/api/media/${id}`, {
      method: "DELETE",
    }),

  // Projects
  getProjects: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    const qs = q.toString();
    return fetchJson<Project[]>(`/api/projects${qs ? `?${qs}` : ""}`);
  },

  createProject: (data: {
    name: string;
    description?: string;
    location?: string;
    organization?: string;
    status?: string;
  }) =>
    fetchJson<Project>("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  getProjectById: (id: string) => fetchJson<Project>(`/api/projects/${id}`),

  getProjectMedia: (id: string) => fetchJson<MediaItem[]>(`/api/projects/${id}/media`),

  // Activities
  getActivities: (limit: number = 20) =>
    fetchJson<Activity[]>(`/api/activities?limit=${limit}`),

  // Semantic Search
  searchMedia: (params: {
    query: string;
    limit?: number;
    project_id?: string;
    media_type?: string;
    location?: string;
    activity?: string;
    tag?: string;
  }) => {
    return fetchJson<import("@/types").SearchResponse>("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  },

  // Voice Intelligence (OmniDimension)
  getVoiceSession: () =>
    fetchJson<import("@/types").VoiceSessionConfig>("/api/voice/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "field_auditor" }),
    }),

  queryVoice: (transcript: string, context?: Record<string, unknown>) =>
    fetchJson<import("@/types").VoiceQueryResponse>("/api/voice/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, context }),
    }),

  // AI Re-analysis
  triggerMediaAnalysis: (id: string) =>
    fetchJson<MediaDetail>(`/api/media/${id}/analyze`, {
      method: "POST",
    }),

  // Before / After Impact Comparisons (Phase 3)
  getComparisons: (params?: { project_id?: string; status?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.project_id && params.project_id !== "all") q.set("project_id", params.project_id);
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return fetchJson<import("@/types").Comparison[]>(`/api/comparisons${qs ? `?${qs}` : ""}`);
  },

  getComparisonById: (id: string) =>
    fetchJson<import("@/types").Comparison>(`/api/comparisons/${id}`),

  createComparison: (data: {
    project_id: string;
    before_media_id: string;
    after_media_id: string;
    title?: string;
  }) =>
    fetchJson<import("@/types").Comparison>("/api/comparisons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  triggerComparisonAnalysis: (id: string) =>
    fetchJson<import("@/types").Comparison>(`/api/comparisons/${id}/analyze`, {
      method: "POST",
    }),

  deleteComparison: (id: string) =>
    fetchJson<{ status: string; message: string }>(`/api/comparisons/${id}`, {
      method: "DELETE",
    }),

  getComparisonSources: (id: string) =>
    fetchJson<import("@/types").ComparisonSources>(`/api/comparisons/${id}/sources`),

  getSuggestedPairs: (projectId: string) =>
    fetchJson<import("@/types").SuggestedPair[]>(`/api/comparisons/suggestions?project_id=${projectId}`),

  getProjectComparisons: (projectId: string) =>
    fetchJson<import("@/types").Comparison[]>(`/api/projects/${projectId}/comparisons`),

  // Video Intelligence (Phase 3.5)
  getVideoAnalysis: (id: string) =>
    fetchJson<import("@/types").VideoAnalysisData>(`/api/media/${id}/video-analysis`),

  retryMediaAnalysis: (id: string) =>
    fetchJson<{ status: string; media_id: string; message: string }>(`/api/media/${id}/retry-analysis`, {
      method: "POST",
    }),

  getVideoMoments: (id: string) =>
    fetchJson<import("@/types").KeyMoment[]>(`/api/videos/${id}/moments`),

  extractVideoFrames: (id: string) =>
    fetchJson<{ status: string; video_id: string; message: string }>(`/api/videos/${id}/extract-frames`, {
      method: "POST",
    }),

  // Impact Reports & Storytelling (Phase 4)
  getReports: (params?: { project_id?: string; status?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.project_id && params.project_id !== "all") q.set("project_id", params.project_id);
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return fetchJson<import("@/types").Report[]>(`/api/reports${qs ? `?${qs}` : ""}`);
  },

  getReportById: (id: string) =>
    fetchJson<import("@/types").Report>(`/api/reports/${id}`),

  getPublicReport: (id: string) =>
    fetchJson<import("@/types").Report>(`/api/reports/public/${id}`),

  createReport: (data: import("@/types").ReportCreateInput) =>
    fetchJson<import("@/types").Report>("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  regenerateReport: (id: string) =>
    fetchJson<import("@/types").Report>(`/api/reports/${id}/regenerate`, {
      method: "POST",
    }),

  deleteReport: (id: string) =>
    fetchJson<{ status: string; message: string }>(`/api/reports/${id}`, {
      method: "DELETE",
    }),

  getReportEvidence: (id: string) =>
    fetchJson<import("@/types").ReportEvidenceItem[]>(`/api/reports/${id}/evidence`),

  getReportCampaignContent: (id: string) =>
    fetchJson<import("@/types").CampaignContent>(`/api/reports/${id}/campaign-content`),

  getProjectReports: (projectId: string) =>
    fetchJson<import("@/types").Report[]>(`/api/projects/${projectId}/reports`),
};

// Named exports for ergonomic importing
export const {
  getHealth,
  getDashboardStats,
  getMedia,
  getMediaById,
  uploadMedia,
  deleteMedia,
  getProjects,
  createProject,
  getProjectById,
  getProjectMedia,
  getActivities,
  searchMedia,
  getVoiceSession,
  queryVoice,
  triggerMediaAnalysis,
  getComparisons,
  getComparisonById,
  createComparison,
  triggerComparisonAnalysis,
  deleteComparison,
  getComparisonSources,
  getSuggestedPairs,
  getProjectComparisons,
  getVideoAnalysis,
  retryMediaAnalysis,
  getVideoMoments,
  extractVideoFrames,
  getReports,
  getReportById,
  getPublicReport,
  createReport,
  regenerateReport,
  deleteReport,
  getReportEvidence,
  getReportCampaignContent,
  getProjectReports,
} = api;


