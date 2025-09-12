import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { authService } from '../services/auth';
import ErrorBoundary from './ErrorBoundary';

// Pages
import LoginPage from '../pages/LoginPage';
import QRLandingPage from '../pages/QRLandingPage';
import DashboardPage from '../pages/DashboardPage';
import CreateCategoryPage from '../pages/CreateCategoryPage';
import CreateProductPage from '../pages/CreateProductPage';
import ProtectedRoute from './ProtectedRoute';

// Setup auth interceptors
authService.setupInterceptors();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppRouter: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/p/:code" element={<QRLandingPage />} />
              <Route
                path="/dashboard/products"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/categories/new"
                element={
                  <ProtectedRoute>
                    <CreateCategoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/products/new"
                element={
                  <ProtectedRoute>
                    <CreateProductPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard/products" replace />} />
              <Route path="*" element={<Navigate to="/dashboard/products" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default AppRouter;