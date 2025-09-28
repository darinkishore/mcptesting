import {
  API_BASE_URL,
  API_ENDPOINTS,
  apiCall,
  HealthResponse,
  HelloResponse,
  HelloRequest,
  SecurityScanJobCreated,
  SecurityScanJobStatus,
  SecurityScanRequest,
} from '@/types/api';

// API Client functions

export const api = {
  // Health check
  async getHealth() {
    return apiCall<HealthResponse>(API_ENDPOINTS.health);
  },

  // Hello endpoint
  async sayHello(params?: HelloRequest) {
    const queryString = params?.name ? `?name=${encodeURIComponent(params.name)}` : '';
    return apiCall<HelloResponse>(`${API_ENDPOINTS.hello}${queryString}`);
  },

  // Add more API functions as your backend grows
  // Example:
  // async getUsers(params?: PaginationParams) {
  //   const query = new URLSearchParams(params as any).toString();
  //   return apiCall<PaginatedResponse<User>>(`${API_ENDPOINTS.users}?${query}`);
  // },
};

// React hooks for API calls (if you want to use them in components)

export function useApi() {
  return api;
}

export async function createSecurityScanJob(
  payload: SecurityScanRequest
): Promise<SecurityScanJobCreated> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.securityScans}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to create scan job (${response.status})`);
  }

  return response.json() as Promise<SecurityScanJobCreated>;
}

export async function fetchSecurityScanJob(jobId: string): Promise<SecurityScanJobStatus> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.securityScans}/${jobId}`);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to fetch scan job (${response.status})`);
  }

  return response.json() as Promise<SecurityScanJobStatus>;
}
