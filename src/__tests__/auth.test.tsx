import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import type { LoginResponse } from '../types';

// Mock the auth service with all required methods
vi.mock('../services/auth', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(),
    attemptSilentRefresh: vi.fn(),
    setLogoutCallback: vi.fn(),
    setupInterceptors: vi.fn(),
    refreshAccessToken: vi.fn(),
  },
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

// Test component to access auth context
const TestComponent = () => {
  const { user, accessToken, login, logout, isAuthenticated, isHydrating, status } = useAuth();
  
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="authenticated">{isAuthenticated() ? 'true' : 'false'}</div>
      <div data-testid="hydrating">{isHydrating() ? 'true' : 'false'}</div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <div data-testid="user-role">{user?.role || 'no-role'}</div>
      <div data-testid="access-token">{accessToken || 'no-token'}</div>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('Auth Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Get the mocked authService and setup defaults
    const { authService } = await import('../services/auth');
    vi.mocked(authService.attemptSilentRefresh).mockResolvedValue(null);
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should start in hydrating state and transition to unauthenticated when no stored data', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for hydration to complete
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
      expect(screen.getByTestId('hydrating')).toHaveTextContent('false');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('should successfully rehydrate with valid stored data', async () => {
    const user = {
      id: 1,
      email: 'restored@test.com',
      role: 'ADMIN' as const,
      brand_id: null,
    };

    localStorage.setItem('accessToken', 'old-token');
    localStorage.setItem('authUser', JSON.stringify(user));

    // Mock successful silent refresh
    const { authService } = await import('../services/auth');
    vi.mocked(authService.attemptSilentRefresh).mockResolvedValue({
      access: 'new-token'
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should start hydrating
    expect(screen.getByTestId('status')).toHaveTextContent('hydrating');

    // Wait for successful rehydration
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user-email')).toHaveTextContent('restored@test.com');
      expect(screen.getByTestId('access-token')).toHaveTextContent('new-token');
    });

    // Should update localStorage with new token
    expect(localStorage.getItem('accessToken')).toBe('new-token');
  });

  it('should handle failed rehydration gracefully', async () => {
    localStorage.setItem('accessToken', 'expired-token');
    localStorage.setItem('authUser', JSON.stringify({
      id: 1,
      email: 'test@test.com',
      role: 'MANAGER',
      brand_id: 123,
    }));

    // Mock failed silent refresh
    const { authService } = await import('../services/auth');
    vi.mocked(authService.attemptSilentRefresh).mockResolvedValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for failed rehydration
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
      expect(screen.getByTestId('access-token')).toHaveTextContent('no-token');
    });
  });

  it('should store access token and user after successful login', async () => {
    const mockResponse: LoginResponse = {
      access: 'mock-access-token',
      user: {
        id: 1,
        email: 'admin@admin.com',
        role: 'ADMIN',
        brand_id: null,
      },
    };

    // Mock successful login
    const { authService } = await import('../services/auth');
    vi.mocked(authService.login).mockResolvedValue(mockResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial hydration to complete
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
    });

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user-email')).toHaveTextContent('admin@admin.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN');
      expect(screen.getByTestId('access-token')).toHaveTextContent('mock-access-token');
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });

    // Check localStorage
    expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
    expect(JSON.parse(localStorage.getItem('authUser') || '{}')).toEqual(mockResponse.user);
  });

  it('should handle corrupted localStorage gracefully', async () => {
    localStorage.setItem('accessToken', 'valid-token');
    localStorage.setItem('authUser', 'invalid-json');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
      expect(screen.getByTestId('access-token')).toHaveTextContent('no-token');
    });

    // Should clear corrupted data
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('authUser')).toBeNull();
  });
});