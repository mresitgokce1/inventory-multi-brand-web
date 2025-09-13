import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { LoginResponse } from '../types';
import { getTimeUntilExpiry } from '../utils/jwt';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // httpOnly refresh cookie gönder
});

class AuthService {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  private refreshTimer: number | null = null;
  private onLogout: (() => void) | null = null;

  // === Public API ===
  setupInterceptors() {
    apiClient.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    apiClient.interceptors.response.use(
      (resp) => resp,
      async (error) => {
        const original = error.config;

        // Sadece ilk 401'de refresh dene
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;

          // Auth uçlarında loop yapma
          if (
            original.url?.includes('/api/auth/login/') ||
            original.url?.includes('/api/auth/refresh/')
          ) {
            return Promise.reject(error);
          }

          try {
            const newAccess = await this.refreshAccessToken(); // cookie ile
            original.headers.Authorization = `Bearer ${newAccess}`;
            return apiClient(original);
          } catch (e) {
            // Refresh başarısız. Access'ı temizle. Redirect etme.
            this.clearAccessToken();
            return Promise.reject(e);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setLogoutCallback(cb: () => void) {
    this.onLogout = cb;
  }

  getAccessToken() {
    return this.accessToken;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
    this.scheduleRefresh(token);
  }

  clearAccessToken() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    this.clearRefreshTimer();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const resp: AxiosResponse<LoginResponse> = await apiClient.post('/api/auth/login/', {
      email,
      password,
    });
    return resp.data; // caller: setUser + setAccessToken yapacak
  }

  async logout() {
    try {
      await apiClient.post('/api/auth/logout/', {}); // refresh cookie’yi server tarafında temizle
    } catch (e) {
      console.warn('Backend logout failed:', e);
    }
    this.performLogout();
  }

  /**
   * Uygulama açılışında sessiz yenileme.
   * Cookie varsa yeni access döner. Yoksa null.
   */
  async attemptSilentRefresh(): Promise<{ access: string } | null> {
    try {
      const resp: AxiosResponse<{ access: string }> = await apiClient.post(
        '/api/auth/refresh/',
        {},
        { withCredentials: true } // Authorization header yok
      );
      return resp.data;
    } catch {
      // Sessiz yenileme başarısız. Local access & user temizlenebilir.
      localStorage.removeItem('accessToken');
      return null;
    }
  }

  /**
   * Access token’ı sadece cookie ile yeniler.
   * Authorization header YOK.
   */
  async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const resp: AxiosResponse<{ access: string }> = await apiClient.post(
          '/api/auth/refresh/',
          {},
          { withCredentials: true }
        );
        const newAccess = resp.data.access;
        this.setAccessToken(newAccess); // localStorage + scheduleRefresh
        return newAccess;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // === Internal ===
  private scheduleRefresh(token: string) {
    this.clearRefreshTimer();
    const ms = getTimeUntilExpiry(token); // milisaniye
    if (!ms || ms <= 0) return;

    // Exp - 120 sn, alt sınır 15 sn
    const delay = Math.max(ms - 120_000, 15_000);

    this.refreshTimer = window.setTimeout(() => {
      this.refreshAccessToken().catch((err) => {
        console.warn('Scheduled token refresh failed:', err);
        // burada logout yok. Sadece access'ı temizleyelim ki 401 olursa tekrar login akışı çalışsın.
        this.clearAccessToken();
      });
    }, delay);
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private performLogout() {
    this.clearAccessToken();
    localStorage.removeItem('authUser');
    localStorage.removeItem('pending_path');

    if (
      window.location.pathname !== '/login' &&
      !window.location.pathname.startsWith('/p/')
    ) {
      localStorage.setItem(
        'pending_path',
        window.location.pathname + window.location.search
      );
    }

    if (this.onLogout) this.onLogout();

    if (!window.location.pathname.startsWith('/p/')) {
      window.location.href = '/login';
    }
  }
}

export const authService = new AuthService();
export default apiClient;
