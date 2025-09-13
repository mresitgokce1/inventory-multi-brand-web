import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import { AuthContext } from '../contexts/auth-context';
import type { AuthContextType } from '../contexts/auth-context';

// Mock the product service
vi.mock('../services/product', () => ({
  productService: {
    getProducts: vi.fn().mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null
    }),
    generateQRCode: vi.fn(),
    deleteProduct: vi.fn(),
  }
}));

const createMockAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: null,
  accessToken: null,
  status: 'unauthenticated',
  login: vi.fn(),
  logout: vi.fn(),
  getAccessToken: vi.fn(),
  isAuthenticated: vi.fn().mockReturnValue(false),
  isHydrating: vi.fn().mockReturnValue(false),
  ...overrides,
});

const renderWithProviders = (authContext: AuthContextType) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authContext}>
          <DashboardPage />
        </AuthContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('DashboardPage - Add Product Button', () => {
  it('should show Add Product button for ADMIN role', async () => {
    const authContext = createMockAuthContext({
      user: { id: 1, email: 'admin@test.com', role: 'ADMIN', brand_id: null },
      status: 'authenticated',
      isAuthenticated: vi.fn().mockReturnValue(true),
      isHydrating: vi.fn().mockReturnValue(false),
    });

    renderWithProviders(authContext);

    // Wait for the component to load and check for Add Product button
    expect(await screen.findByText('Add Product')).toBeInTheDocument();
  });

  it('should show Add Product button for BRAND_MANAGER role', async () => {
    const authContext = createMockAuthContext({
      user: { id: 2, email: 'manager@test.com', role: 'BRAND_MANAGER', brand_id: 123 },
      status: 'authenticated',
      isAuthenticated: vi.fn().mockReturnValue(true),
      isHydrating: vi.fn().mockReturnValue(false),
    });

    renderWithProviders(authContext);

    expect(await screen.findByText('Add Product')).toBeInTheDocument();
  });

  it('should show Add Product button for MANAGER role (alias)', async () => {
    const authContext = createMockAuthContext({
      user: { id: 3, email: 'manager@test.com', role: 'MANAGER', brand_id: 123 },
      status: 'authenticated',
      isAuthenticated: vi.fn().mockReturnValue(true),
      isHydrating: vi.fn().mockReturnValue(false),
    });

    renderWithProviders(authContext);

    expect(await screen.findByText('Add Product')).toBeInTheDocument();
  });

  it('should NOT show Add Product button for STAFF role', async () => {
    const authContext = createMockAuthContext({
      user: { id: 4, email: 'staff@test.com', role: 'STAFF', brand_id: 123 },
      status: 'authenticated',
      isAuthenticated: vi.fn().mockReturnValue(true),
      isHydrating: vi.fn().mockReturnValue(false),
    });

    renderWithProviders(authContext);

    // Wait for page to load and ensure Add Product button is not present
    await screen.findByText('Your Products');
    expect(screen.queryByText('Add Product')).not.toBeInTheDocument();
  });

  it('should NOT show Add Product button during hydration', async () => {
    const authContext = createMockAuthContext({
      user: { id: 1, email: 'admin@test.com', role: 'ADMIN', brand_id: null },
      status: 'authenticated',
      isAuthenticated: vi.fn().mockReturnValue(true),
      isHydrating: vi.fn().mockReturnValue(true), // Still hydrating
    });

    renderWithProviders(authContext);

    await screen.findByText('Your Products');
    expect(screen.queryByText('Add Product')).not.toBeInTheDocument();
  });

  it('should allow ADMIN with null brand_id', async () => {
    const authContext = createMockAuthContext({
      user: { id: 1, email: 'admin@test.com', role: 'ADMIN', brand_id: null },
      status: 'authenticated',
      isAuthenticated: vi.fn().mockReturnValue(true),
      isHydrating: vi.fn().mockReturnValue(false),
    });

    renderWithProviders(authContext);

    expect(await screen.findByText('Add Product')).toBeInTheDocument();
    expect(await screen.findByText(/Global Admin/)).toBeInTheDocument();
  });

  it('should show Create Your First Product button in empty state for authorized users', async () => {
    const authContext = createMockAuthContext({
      user: { id: 1, email: 'admin@test.com', role: 'ADMIN', brand_id: null },
      status: 'authenticated',
      isAuthenticated: vi.fn().mockReturnValue(true),
      isHydrating: vi.fn().mockReturnValue(false),
    });

    renderWithProviders(authContext);

    expect(await screen.findByText('Create Your First Product')).toBeInTheDocument();
  });
});