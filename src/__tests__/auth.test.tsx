import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { authService } from '../services/auth';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import type { LoginResponse } from '../types';

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
  const { user, accessToken, login, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <div data-testid="user-role">{user?.role || 'no-role'}</div>
      <div data-testid="access-token">{accessToken || 'no-token'}</div>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
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
    const mockLogin = vi.fn().mockResolvedValue(mockResponse);
    authService.login = mockLogin;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user-email')).toHaveTextContent('admin@admin.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN');
      expect(screen.getByTestId('access-token')).toHaveTextContent('mock-access-token');
    });

    // Check localStorage
    expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
    expect(JSON.parse(localStorage.getItem('authUser') || '{}')).toEqual(mockResponse.user);
  });

  it('should clear auth state on logout', async () => {
    // Set initial auth state
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('authUser', JSON.stringify({
      id: 1,
      email: 'test@test.com',
      role: 'MANAGER',
      brand_id: 123,
    }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially should be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
      expect(screen.getByTestId('access-token')).toHaveTextContent('no-token');
    });

    // Check localStorage is cleared
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('authUser')).toBeNull();
  });

  it('should restore auth state from localStorage on mount', async () => {
    const user = {
      id: 1,
      email: 'restored@test.com',
      role: 'ADMIN' as const,
      brand_id: null,
    };

    localStorage.setItem('accessToken', 'restored-token');
    localStorage.setItem('authUser', JSON.stringify(user));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user-email')).toHaveTextContent('restored@test.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN');
      expect(screen.getByTestId('access-token')).toHaveTextContent('restored-token');
    });
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
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
      expect(screen.getByTestId('access-token')).toHaveTextContent('no-token');
    });

    // Should clear corrupted data
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('authUser')).toBeNull();
  });
});