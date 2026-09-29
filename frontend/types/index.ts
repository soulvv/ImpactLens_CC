export type MediaType = "image" | "video";

export type MediaStatus = "uploaded" | "pending_analysis" | "processing" | "analyzing" | "ready" | "verified" | "failed" | "READY" | "PROCESSING" | (string & {});

export type ProjectStatus = "active" | "archived" | "review";

export type ComparisonStatus = "draft" | "analyzing" | "ready" | "failed" | "READY" | "ANALYZING" | (string & {});

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  organization?: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  media_count?: number;
}

export interface KeyMoment {
  timestamp: number;
  description: string;
}

export interface VideoAnalysisData {
  media_id: string;
  filename: string;
  status: string;
  duration_seconds?: number | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  summary: string;
  activity?: string | null;
  location?: string | null;
  objects: string[];
  visual_signals: string[];
  conditions: string[];
  tags: string[];
  key_moments: KeyMoment[];
  frame_count: number;
  confidence: number;
  model_name: string;
  analysis_version: string;
}

export interface MediaAnalysis {
  id: string;
  media_id: string;
  description: string;
  project?: string | null;
  activity?: string | null;
  location?: string | null;
  objects: string[];
  visual_signals: string[];
  conditions: string[];
  tags: string[];
  key_moments?: KeyMoment[];
  frame_count?: number;
  confidence: number;
  model_name: string;
  analysis_version: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  project_id?: string | null;
  project_name?: string | null;
  filename: string;
  media_type: MediaType;
  file_size: number;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  duration_seconds?: number | null;
  frame_rate?: number | null;
  cloudinary_public_id?: string | null;
  cloudinary_url: string;
  secure_url: string;
  thumbnail_url?: string | null;
  status: MediaStatus;
  activity?: string | null;
  location?: string | null;
  tags?: string[];
  description?: string | null;
  ai_description?: string | null;
  analysis?: MediaAnalysis | null;
  created_at: string;
  updated_at: string;
}

export interface MediaDetail extends MediaItem {
  project?: Project | null;
  analysis?: MediaAnalysis | null;
  ai_status: string;
  ai_scheduled_modules: string[];
}

export interface SearchResultItem {
  media_id: string;
  secure_url: string;
  thumbnail_url: string;
  filename: string;
  media_type: string;
  project_id?: string | null;
  project?: string | null;
  location?: string | null;
  activity?: string | null;
  description: string;
  similarity_score: number;
  confidence: number;
  tags: string[];
  duration_seconds?: number | null;
  key_moments?: KeyMoment[];
  created_at: string;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
}

export interface VoiceSessionConfig {
  session_id: string;
  agent_id: string;
  session_token: string;
  mode: string;
  websocket_url?: string | null;
  capabilities: string[];
  system_prompt?: string;
}

export interface VoiceQueryResponse {
  transcript: string;
  spoken_response: string;
  action: string;
  route?: string;
  media_results: Array<{
    media_id: string;
    filename: string;
    secure_url: string;
    media_type?: string;
    duration_seconds?: number | null;
    thumbnail_url?: string;
    activity?: string;
    location?: string;
    project?: string;
    description?: string;
    similarity_score?: number;
  }>;
  project_id?: string;
  project_name?: string;
  top_result_id?: string;
  comparison_id?: string;
  overall_change?: string;
  report_id?: string;
  report_title?: string;
}


export interface Activity {
  id: string;
  project_id?: string | null;
  project_name?: string | null;
  action: string;
  description: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_media: number;
  active_projects: number;
  processing_queue: number;
  storage_bytes: number;
  storage_human: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recent_media: MediaItem[];
  active_projects: Project[];
  recent_activity: Activity[];
}

export interface HealthStatus {
  status: "healthy" | "degraded";
  service: string;
  version: string;
  database: {
    status: string;
    engine: string;
  };
  media_storage: {
    provider: string;
    live_configured: boolean;
  };
  timestamp: string;
}

// ==========================================
// Phase 3: Impact Comparison Types
// ==========================================

export interface DetectedChange {
  category: string;
  before: string;
  after: string;
  evidence: string;
  confidence: number;
}

export interface AIComparisonOutput {
  overall_change: string;
  summary: string;
  changes_detected: DetectedChange[];
  positive_changes: string[];
  negative_changes: string[];
  unchanged_elements: string[];
  confidence: number;
}

export interface Comparison {
  id: string;
  project_id: string;
  project_name?: string | null;
  before_media_id: string;
  after_media_id: string;
  title?: string | null;
  status: ComparisonStatus;
  comparison_summary?: string | null;
  overall_change?: string | null;
  analysis_result?: AIComparisonOutput | null;
  confidence: number;
  model_name: string;
  analysis_version: string;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  before_media?: MediaItem | null;
  after_media?: MediaItem | null;
}

export interface ComparisonSources {
  comparison_id: string;
  project_id: string;
  project_name?: string | null;
  before_media: {
    id: string;
    filename: string;
    media_type: string;
    cloudinary_public_id: string;
    secure_url: string;
    created_at: string;
    activity?: string | null;
    location?: string | null;
  };
  after_media: {
    id: string;
    filename: string;
    media_type: string;
    cloudinary_public_id: string;
    secure_url: string;
    created_at: string;
    activity?: string | null;
    location?: string | null;
  };
  model_name: string;
  analysis_version: string;
  comparison_timestamp: string;
  traceability_hash: string;
}

export interface SuggestedPair {
  project_id: string;
  project_name: string;
  before_media: MediaItem;
  after_media: MediaItem;
  reason: string;
  confidence_label: "High confidence" | "Suggested comparison" | "Potential match";
  days_apart?: number | null;
}

// ==========================================
// Phase 4: Impact Report Types
// ==========================================

export type ReportStatus = "draft" | "generating" | "ready" | "failed";

export interface ReportEvidenceItem {
  id: string;
  report_id: string;
  media_id?: string | null;
  comparison_id?: string | null;
  video_moment_id?: string | null;
  section: string;
  evidence_role: string;
  notes?: string | null;
  created_at: string;
  media_filename?: string | null;
  media_url?: string | null;
  media_type?: string | null;
}

export interface CampaignSource {
  id: string;
  label: string;
  role: string;
}

export interface CampaignContent {
  headline: string;
  short_summary: string;
  social_caption: string;
  impact_story: string;
  sponsor_summary: string;
  callout: string;
  sources?: CampaignSource[];
}

export interface ActivityObserved {
  activity: string;
  count: number;
  locations?: string[];
  notes?: string;
}

export interface KeyObservation {
  title?: string;
  claim?: string;
  observation?: string;
  evidence_source?: string;
  evidence_basis?: string;
  media_ids?: string[];
  source_ids?: string[];
  comparison_id?: string;
}


export interface ReportCoverData {
  project_name: string;
  location?: string | null;
  organization?: string | null;
  hero_media_id?: string | null;
  hero_media_url?: string | null;
  hero_caption?: string | null;
  generated_at: string;
}

export interface ReportSnapshot {
  total_media: number;
  images_count: number;
  videos_count: number;
  comparisons_count: number;
  activities_count: number;
  reporting_period: string;
}

export interface ReportGalleryItem {
  media_id: string;
  filename: string;
  secure_url: string;
  thumbnail_url: string;
  media_type: MediaType;
  activity?: string | null;
  location?: string | null;
  created_at?: string | null;
  caption?: string | null;
}

export interface ReportVideoItem {
  video_id: string;
  filename: string;
  secure_url: string;
  duration_seconds?: number | null;
  activity?: string | null;
  summary: string;
  key_moments: KeyMoment[];
}

export interface ReportComparisonItem {
  comparison_id: string;
  title: string;
  status: string;
  before_media_id: string;
  before_media_url?: string | null;
  before_date: string;
  after_media_id: string;
  after_media_url?: string | null;
  after_date: string;
  overall_change: string;
  summary?: string | null;
}

export interface ReportTimelineMilestone {
  date: string;
  media_id: string;
  media_type: string;
  filename: string;
  activity?: string | null;
  location?: string | null;
  thumbnail_url?: string | null;
}

export interface GeneratedReportContent {
  cover: ReportCoverData;
  title: string;
  subtitle?: string;
  overview: string;
  evidence_summary: string;
  snapshot: ReportSnapshot;
  activities_observed: ActivityObserved[];
  locations: string[];
  visual_changes: ReportComparisonItem[];
  video_evidence: ReportVideoItem[];
  timeline: ReportTimelineMilestone[];
  evidence_gallery: ReportGalleryItem[];
  key_observations: KeyObservation[];
  campaign_content: CampaignContent;
}

export interface Report {
  id: string;
  project_id: string;
  project_name?: string | null;
  project_location?: string | null;
  project_organization?: string | null;
  title: string;
  status: ReportStatus;
  reporting_period_start?: string | null;
  reporting_period_end?: string | null;
  evidence_count: number;
  comparison_count: number;
  generated_content?: GeneratedReportContent | null;
  model_name: string;
  analysis_version: string;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  evidence_items?: ReportEvidenceItem[];
}

export interface ReportCreateInput {
  project_id: string;
  title?: string;
  reporting_period_start?: string;
  reporting_period_end?: string;
  include_images?: boolean;
  include_videos?: boolean;
  include_comparisons?: boolean;
  sections?: string[];
}

