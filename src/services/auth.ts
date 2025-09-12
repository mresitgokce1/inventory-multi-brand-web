import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { LoginResponse, AuthTokens } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

class AuthService {
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<string> | null = null;

  setAuthTokens(tokens: AuthTokens) {
    this.tokens = tokens;
  }

  clearAuthTokens() {
    this.tokens = null;
    this.refreshPromise = null;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await apiClient.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.tokens?.refresh) {
      throw new Error('No refresh token available');
    }

    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response: AxiosResponse<{ access: string }> = await apiClient.post(
          '/api/auth/refresh',
          { refresh: this.tokens!.refresh }
        );
        
        const newAccessToken = response.data.access;
        
        // Update stored tokens
        if (this.tokens) {
          this.tokens.access = newAccessToken;
          localStorage.setItem('auth_tokens', JSON.stringify(this.tokens));
        }
        
        return newAccessToken;
      } catch (error) {
        // Refresh failed, clear tokens and redirect to login
        this.clearAuthTokens();
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
        
        // Store current path for redirect after login
        if (window.location.pathname !== '/login') {
          localStorage.setItem('pending_path', window.location.pathname + window.location.search);
        }
        
        window.location.href = '/login';
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  setupInterceptors() {
    // Request interceptor to add auth header
    apiClient.interceptors.request.use(
      (config) => {
        if (this.tokens?.access) {
          config.headers.Authorization = `Bearer ${this.tokens.access}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle 401 errors
    apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }
}

export const authService = new AuthService();
export default apiClient;