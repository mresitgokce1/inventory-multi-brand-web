import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthContext } from '../contexts/auth-context';
import type { AuthContextType, User } from '../types';

// Mock navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state }: { to: string; state?: any }) => {
      mockNavigate(to, state);
      return <div data-testid="navigate">{`Navigating to: ${to}`}</div>;
    },
  };
});

const renderProtectedRoute = (authValue: AuthContextType, allowedRoles?: ('ADMIN' | 'MANAGER')[]) => {
  return render(
    <MemoryRouter initialEntries={['/dashboard/products']}>
      <AuthContext.Provider value={authValue}>
        <ProtectedRoute allowedRoles={allowedRoles}>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should show loading state when auth is loading', () => {
    const authValue: AuthContextType = {
      user: null,
      accessToken: null,
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: false,
      isLoading: true,
    };

    renderProtectedRoute(authValue);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    const authValue: AuthContextType = {
      user: null,
      accessToken: null,
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: false,
      isLoading: false,
    };

    renderProtectedRoute(authValue);
    
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      from: expect.objectContaining({
        pathname: '/dashboard/products',
      }),
    });
  });

  it('should allow access for authenticated ADMIN user', () => {
    const user: User = {
      id: 1,
      email: 'admin@test.com',
      role: 'ADMIN',
      brand_id: null,
    };

    const authValue: AuthContextType = {
      user,
      accessToken: 'valid-token',
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
    };

    renderProtectedRoute(authValue);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should allow access for authenticated MANAGER user', () => {
    const user: User = {
      id: 2,
      email: 'manager@test.com',
      role: 'MANAGER',
      brand_id: 123,
    };

    const authValue: AuthContextType = {
      user,
      accessToken: 'valid-token',
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
    };

    renderProtectedRoute(authValue);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should deny access when user role is not in allowedRoles', () => {
    const user: User = {
      id: 2,
      email: 'manager@test.com',
      role: 'MANAGER',
      brand_id: 123,
    };

    const authValue: AuthContextType = {
      user,
      accessToken: 'valid-token',
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
    };

    // Only allow ADMIN
    renderProtectedRoute(authValue, ['ADMIN']);
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
  });

  it('should allow ADMIN user even with null brand_id', () => {
    const user: User = {
      id: 1,
      email: 'admin@test.com',
      role: 'ADMIN',
      brand_id: null,
    };

    const authValue: AuthContextType = {
      user,
      accessToken: 'valid-token',
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
    };

    renderProtectedRoute(authValue);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should use default allowedRoles when not specified', () => {
    const user: User = {
      id: 2,
      email: 'manager@test.com',
      role: 'MANAGER',
      brand_id: 123,
    };

    const authValue: AuthContextType = {
      user,
      accessToken: 'valid-token',
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
    };

    // Should default to both ADMIN and MANAGER
    renderProtectedRoute(authValue);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});