import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock the API calls to avoid network requests during tests
vi.mock('../services/product', () => ({
  productService: {
    resolveQR: vi.fn(),
    getProducts: vi.fn(),
    generateQRCode: vi.fn(),
  },
}));

// Mock the auth service with all required methods
vi.mock('../services/auth', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    setupInterceptors: vi.fn(),
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(),
    attemptSilentRefresh: vi.fn(),
    setLogoutCallback: vi.fn(),
    refreshAccessToken: vi.fn(),
  },
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

const renderApp = () => {
  return render(<App />);
};

describe('App Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
    
    // Mock silent refresh to return null (no valid session)
    const { authService } = await import('../services/auth');
    vi.mocked(authService.attemptSilentRefresh).mockResolvedValue(null);
  });

  it('redirects to login page for unauthenticated users', async () => {
    renderApp();
    
    // Wait for hydration to complete and login form to appear
    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Multi-Brand Inventory Platform')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders login form with proper fields', async () => {
    renderApp();
    
    // Wait for hydration to complete
    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });
    
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');
    expect(submitButton).toHaveAttribute('type', 'submit');
  });
});