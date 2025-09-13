import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { LoginResponse } from '../types';
import { getTimeUntilExpiry } from '../utils/jwt';

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
  private refreshTimer: number | null = null;
  private onLogout: (() => void) | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
    this.scheduleRefresh(token);
  }

  clearAccessToken() {
    this.accessToken = null;
    this.refreshPromise = null;
    this.clearRefreshTimer();
  }

  getAccessToken() {
    return this.accessToken;
  }

  setLogoutCallback(callback: () => void) {
    this.onLogout = callback;
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private scheduleRefresh(token: string) {
    this.clearRefreshTimer();
    
    const timeUntilExpiry = getTimeUntilExpiry(token);
    if (!timeUntilExpiry || timeUntilExpiry <= 0) {
      // Token already expired or can't determine expiry
      return;
    }

    // Schedule refresh 60 seconds before expiry, with minimum 30 seconds delay
    const refreshDelay = Math.max(timeUntilExpiry - 60000, 30000);
    
    this.refreshTimer = window.setTimeout(async () => {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        console.warn('Scheduled token refresh failed:', error);
        // Logout will be handled by refresh method
      }
    }, refreshDelay);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await apiClient.post('/api/auth/login/', {
      email,
      password,
    });
    return response.data;
  }

  async refreshAccessToken(): Promise<string> {
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
            withCredentials: true, // Ensure httpOnly cookie is sent
          }
        );
        
        const newAccessToken = response.data.access;
        
        // Update stored access token
        this.accessToken = newAccessToken;
        localStorage.setItem('accessToken', newAccessToken);
        
        // Schedule next refresh
        this.scheduleRefresh(newAccessToken);
        
        return newAccessToken;
      } catch (error) {
        // Refresh failed, trigger logout
        this.performLogout();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Attempt silent refresh using stored token and httpOnly refresh cookie
   * Used during app startup for rehydration
   */
  async attemptSilentRefresh(): Promise<{ access: string } | null> {
    const storedToken = localStorage.getItem('accessToken');
    if (!storedToken) {
      return null;
    }

    try {
      const response: AxiosResponse<{ access: string }> = await apiClient.post(
        '/api/auth/refresh/',
        {},
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
          withCredentials: true, // Ensure httpOnly cookie is sent
        }
      );

      return response.data;
    } catch {
      // Silent refresh failed, clear stored data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
      return null;
    }
  }

  private performLogout() {
    // Clear tokens and timers
    this.clearAccessToken();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('pending_path');

    // Store current path for redirect after login (if not on public pages)
    if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/p/')) {
      localStorage.setItem('pending_path', window.location.pathname + window.location.search);
    }

    // Trigger logout callback if set
    if (this.onLogout) {
      this.onLogout();
    }

    // Only redirect if not on QR landing page (public-first)
    if (!window.location.pathname.startsWith('/p/')) {
      window.location.href = '/login';
    }
  }

  async logout() {
    // Optional: call backend logout endpoint to clear refresh cookie
    try {
      await apiClient.post('/api/auth/logout/', {});
    } catch (error) {
      // Backend logout not available or failed, continue with client-side cleanup
      console.warn('Backend logout failed:', error);
    }

    this.performLogout();
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

          // Don't attempt refresh on auth endpoints to prevent loops
          if (originalRequest.url?.includes('/api/auth/login/') || 
              originalRequest.url?.includes('/api/auth/refresh/')) {
            return Promise.reject(error);
          }

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