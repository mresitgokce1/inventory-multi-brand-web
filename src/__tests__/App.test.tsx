import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

vi.mock('../services/auth', () => ({
  authService: {
    login: vi.fn(),
    setupInterceptors: vi.fn(),
    setAuthTokens: vi.fn(),
    clearAuthTokens: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('redirects to login page for unauthenticated users', () => {
    renderApp();
    
    // Should show login form
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByText('Multi-Brand Inventory Platform')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders login form with proper fields', () => {
    renderApp();
    
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