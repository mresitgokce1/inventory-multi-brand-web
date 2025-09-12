import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product';
import { useAuth } from '../hooks/useAuth';
import type { QRResolveResponse } from '../types';
import { formatPrice } from '../utils/price';

const QRLandingPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { isAuthenticated, user } = useAuth();
  const [showPrivate, setShowPrivate] = useState(false);

  const {
    data: productData,
    isLoading,
    error,
  } = useQuery<QRResolveResponse>({
    queryKey: ['qr-resolve', code],
    queryFn: () => productService.resolveQR(code!),
    enabled: !!code,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600">
            The QR code you scanned doesn't correspond to a valid product.
          </p>
        </div>
      </div>
    );
  }

  if (!productData) {
    return null;
  }

  const { product_public, product_private } = productData;
  const hasPrivateData = !!product_private;
  
  // Safe access to brand and category data
  const brandName = product_public.brand?.name || 'Unknown Brand';
  const categoryName = product_public.category?.name || 'Unknown Category';
  const brandId = product_public.brand?.id;
  
  // Check if user can view private data
  const canViewPrivate =
    isAuthenticated && 
    user && 
    hasPrivateData && 
    (user.role === 'ADMIN' || 
     (user.role === 'MANAGER' && user.brand_id && brandId && user.brand_id === brandId));

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Product Image */}
        {product_public.image_small_url && (
          <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
            <img
              src={product_public.image_small_url}
              alt={product_public.name || 'Product image'}
              className="w-full h-64 sm:h-80 object-cover"
            />
          </div>
        )}

        {/* Product Information Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {product_public.name || 'Unknown Product'}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  {brandName}
                </span>
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  {categoryName}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {formatPrice(product_public.price)}
              </div>
            </div>
          </div>

          {product_public.description && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product_public.description}</p>
            </div>
          )}
        </div>

        {/* Private Information Toggle */}
        {canViewPrivate && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Sensitive Information</h3>
              <button
                onClick={() => setShowPrivate(!showPrivate)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showPrivate ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showPrivate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {showPrivate && product_private && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">SKU:</span>
                  <span className="text-gray-900">{product_private.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Stock:</span>
                  <span
                    className={`font-medium ${
                      product_private.stock > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {product_private.stock} units
                  </span>
                </div>
              </div>
            )}

            {!showPrivate && (
              <p className="text-sm text-gray-500">
                Enable the toggle above to view inventory details and SKU information.
              </p>
            )}
          </div>
        )}

        {/* Auth Status Message */}
        {hasPrivateData && !isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-blue-800 text-sm">
              <span className="font-medium">Manager Access Available:</span> Sign in to view
              additional product details including inventory and SKU information.
            </p>
            <a
              href="/login"
              className="inline-block mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm underline"
            >
              Sign in to your account
            </a>
          </div>
        )}

        {hasPrivateData && isAuthenticated && !canViewPrivate && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-6">
            <p className="text-orange-800 text-sm">
              <span className="font-medium">Access Restricted:</span> You can only view private
              information for products from your brand{user?.brand_id ? ` (Brand ID: ${user.brand_id})` : ''}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRLandingPage;