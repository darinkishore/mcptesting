import {
  API_ENDPOINTS,
  apiCall,
  HealthResponse,
  HelloResponse,
  HelloRequest
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