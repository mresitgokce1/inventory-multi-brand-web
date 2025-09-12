import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { LoginResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for httpOnly refresh token
});

class AuthService {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearAccessToken() {
    this.accessToken = null;
    this.refreshPromise = null;
  }

  getAccessToken() {
    return this.accessToken;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await apiClient.post('/api/auth/login/', {
      email,
      password,
    });
    return response.data;
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('No access token available for refresh');
    }

    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response: AxiosResponse<{ access: string }> = await apiClient.post(
          '/api/auth/refresh/',
          {}, // Empty body as per backend contract
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );
        
        const newAccessToken = response.data.access;
        
        // Update stored access token
        this.accessToken = newAccessToken;
        localStorage.setItem('accessToken', newAccessToken);
        
        return newAccessToken;
      } catch (error) {
        // Refresh failed, clear tokens and redirect to login
        this.clearAccessToken();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');
        
        // Store current path for redirect after login
        if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/p/')) {
          localStorage.setItem('pending_path', window.location.pathname + window.location.search);
        }
        
        // Only redirect if not on QR landing page (public-first)
        if (!window.location.pathname.startsWith('/p/')) {
          window.location.href = '/login';
        }
        
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
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
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

          // Don't attempt refresh on QR landing pages - they should be public-first
          if (originalRequest.url?.includes('/api/qr/resolve/')) {
            return Promise.reject(error);
          }

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