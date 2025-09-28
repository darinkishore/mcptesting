import type { ProvidersMeta } from '../app/types/core';
import type { SecurityLint } from '../app/types/security';

// API Response Types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface HealthResponse {
  status: string;
  version: string;
  service: string;
}

export interface HelloResponse {
  message: string;
}

// Request Types

export interface HelloRequest {
  name?: string;
}

// User Types (for future use)

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
}

// Pagination Types

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// Error Types

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// API Configuration

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  health: '/',
  hello: '/api/hello',
  users: '/api/users',
  repositories: '/api/repos',
  securityScans: '/api/security/scans',
} as const;

// Security Scan API

export interface SecurityScanInclude {
  mcpScan?: boolean;
  mcpValidator?: boolean;
}

export interface SecurityScanRequest {
  serverUrl: string;
  headers?: Record<string, string>;
  protocolVersion?: string;
  include?: SecurityScanInclude;
  oauthScopes?: string;
}

export type ScanJobStatusValue = 'pending' | 'running' | 'succeeded' | 'error';

export interface SecurityScanJobCreated {
  jobId: string;
  status: ScanJobStatusValue;
}

export interface SecurityScanJobResult {
  providers: ProvidersMeta;
  securityLint: SecurityLint;
  rawArtifacts?: Record<string, string>;
}

export interface SecurityScanJobStatus {
  jobId: string;
  status: ScanJobStatusValue;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  result?: SecurityScanJobResult;
  error?: string | null;
}

// Repository onboarding

export type RepositoryStatus =
  | 'creating'
  | 'awaiting_user'
  | 'authorizing'
  | 'scanning'
  | 'ready'
  | 'error';

export interface Repository {
  id: string;
  name: string;
  serverUrl: string;
  scopes?: string | null;
  status: RepositoryStatus | string;
  authorizeUrl?: string | null;
  lastError?: string | null;
  securityLint?: SecurityLint | null;
  providers?: ProvidersMeta | null;
  artifacts?: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  lastScanJobId?: string | null;
  totalScore?: number | null;
  toolScore?: number | null;
  securityScore?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface CreateRepositoryRequest {
  name: string;
  serverUrl: string;
  scopes?: string | null;
}

export type RepositoryResponse = Repository;

// Helper function for API calls

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
