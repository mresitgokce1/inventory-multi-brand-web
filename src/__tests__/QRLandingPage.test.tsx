import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QRLandingPage from '../pages/QRLandingPage';
import { AuthContext } from '../contexts/auth-context';
import type { User, QRResolveResponse } from '../types';
import type { AuthContextType } from '../contexts/auth-context';
import { productService } from '../services/product';

// Mock the product service
vi.mock('../services/product', () => ({
  productService: {
    resolveQR: vi.fn(),
  },
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ code: 'test-qr-code' }),
  };
});

const mockProductData: QRResolveResponse = {
  product_public: {
    id: '1',
    name: 'Test Product',
    price: '99.99',
    brand: 'Test Brand',
    category: 'Electronics',
    description: 'A test product',
    image: 'https://example.com/image.jpg',
  },
  product_private: {
    sku: 'TEST-SKU-123',
    stock: 50,
  },
};

const renderQRPage = (authValue: AuthContextType) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/p/test-qr-code']}>
        <AuthContext.Provider value={authValue}>
          <QRLandingPage />
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('QR Landing Page', () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productService.resolveQR).mockResolvedValue(mockProductData);
  });

  it('should display public product information when not authenticated', async () => {
    const authValue: AuthContextType = {
      user: null,
      accessToken: null,
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: false,
      isLoading: false,
    };

    renderQRPage(authValue);

    // Should show public product information
    await screen.findByText('Test Product');
    expect(screen.getByText('$99,99')).toBeInTheDocument();
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('A test product')).toBeInTheDocument();
    
    // Should show message about manager access
    expect(screen.getByText('Manager Access Available:')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('should show private information toggle for authenticated ADMIN user', async () => {
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

    renderQRPage(authValue);

    // Should show public info
    await screen.findByText('Test Product');
    
    // Should show private information toggle for ADMIN
    expect(screen.getByText('Sensitive Information')).toBeInTheDocument();
    
    // Toggle should be present
    const toggle = screen.getByRole('button');
    expect(toggle).toBeInTheDocument();
    
    // Click toggle to show private info
    fireEvent.click(toggle);
    
    expect(screen.getByText('TEST-SKU-123')).toBeInTheDocument();
    expect(screen.getByText('50 units')).toBeInTheDocument();
  });

  it('should show access restricted message for MANAGER of different brand', async () => {
    const user: User = {
      id: 2,
      email: 'manager@test.com',
      role: 'MANAGER',
      brand_id: 999, // Different brand
    };

    const authValue: AuthContextType = {
      user,
      accessToken: 'valid-token',
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
    };

    renderQRPage(authValue);

    // Should show public info
    await screen.findByText('Test Product');
    
    // Should show access restricted message
    expect(screen.getByText('Access Restricted:')).toBeInTheDocument();
    expect(screen.getByText(/Brand ID: 999/)).toBeInTheDocument();
  });

  it('should handle error gracefully and not redirect to login', async () => {
    vi.mocked(productService.resolveQR).mockRejectedValue(new Error('Product not found'));

    const authValue: AuthContextType = {
      user: null,
      accessToken: null,
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: false,
      isLoading: false,
    };

    renderQRPage(authValue);

    // Should show error message but not redirect
    await screen.findByText('Product Not Found');
    expect(screen.getByText("The QR code you scanned doesn't correspond to a valid product.")).toBeInTheDocument();
  });

  it('should work for MANAGER with matching brand', async () => {
    // Assuming the product brand corresponds to brand_id 1 somehow
    const user: User = {
      id: 2,
      email: 'manager@test.com',
      role: 'MANAGER',
      brand_id: 1,
    };

    const authValue: AuthContextType = {
      user,
      accessToken: 'valid-token',
      login: mockLogin,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
    };

    // Mock product data where brand matches the pattern for brand_id 1
    const productDataWithMatchingBrand: QRResolveResponse = {
      ...mockProductData,
      product_public: {
        ...mockProductData.product_public,
        brand: '1', // Assuming brand matches brand_id as string
      },
    };
    
    vi.mocked(productService.resolveQR).mockResolvedValue(productDataWithMatchingBrand);

    renderQRPage(authValue);

    // Should show public info
    await screen.findByText('Test Product');
    
    // Should show private information toggle for matching brand
    expect(screen.getByText('Sensitive Information')).toBeInTheDocument();
  });
});