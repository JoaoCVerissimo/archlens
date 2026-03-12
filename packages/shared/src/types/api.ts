import type { SourceType, AnalysisType, FindingCategory, SeverityLevel, ReportType } from "./index.js";

// Standard API response envelope
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// Request bodies
export interface CreateRepositoryRequest {
  name: string;
  sourceType: SourceType;
  sourceUrl?: string;
  branch?: string;
  // file upload handled via multipart for zip
}

export interface TriggerAnalysisRequest {
  analysisType: AnalysisType;
  model?: string;
}

export interface GenerateReportRequest {
  reportType: ReportType;
}

// Query parameters
export interface PaginationQuery {
  page?: number;
  perPage?: number;
}

export interface ListRepositoriesQuery extends PaginationQuery {
  status?: string;
}

export interface ListFilesQuery extends PaginationQuery {
  language?: string;
  pathPrefix?: string;
}

export interface ListFindingsQuery extends PaginationQuery {
  category?: FindingCategory;
  severity?: SeverityLevel;
}

export interface ListAnalysesQuery extends PaginationQuery {
  status?: string;
  type?: AnalysisType;
}
