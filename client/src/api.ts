const TOKEN_KEY = 'mini_crm_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error: ApiError = new Error(
      data?.error?.message || data?.message || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
};

export interface HealthStatus {
  status: string;
  db: string;
  timestamp?: string;
}

export const checkServerHealth = async (): Promise<HealthStatus> => {
  return apiFetch<HealthStatus>('/api/health');
};
