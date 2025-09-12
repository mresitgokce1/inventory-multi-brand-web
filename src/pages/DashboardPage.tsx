import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product';
import { useAuth } from '../hooks/useAuth';
import type { ProductPublic, QRCodeResponse } from '../types';
import QRModal from '../components/QRModal';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<ProductPublic | null>(null);
  const [qrData, setQrData] = useState<QRCodeResponse | null>(null);
  const queryClient = useQueryClient();

  const {
    data: products,
    isLoading,
    error,
  } = useQuery<ProductPublic[]>({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  });

  const generateQRMutation = useMutation({
    mutationFn: (productId: string) => productService.generateQRCode(productId),
    onSuccess: (data, productId) => {
      const product = products?.find((p) => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        setQrData(data);
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to generate QR code');
    },
  });

  const handleGenerateQR = (product: ProductPublic) => {
    generateQRMutation.mutate(product.id);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setQrData(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Products</h1>
          <p className="text-gray-600 mb-4">
            Unable to retrieve your products. Please try again.
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.email}{user?.brand_id ? ` (Brand ID: ${user.brand_id})` : ' (Global Admin)'}
              </p>
            </div>
            <button
              onClick={logout}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Your Products</h2>
          <p className="text-sm text-gray-600">
            Generate QR codes for your products to enable easy scanning and information access.
          </p>
        </div>

        {!products || products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600">
              You don't have any products yet. Contact your administrator to add products.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <span className="text-lg font-bold text-blue-600">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>

                  {product.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <button
                    onClick={() => handleGenerateQR(product)}
                    disabled={generateQRMutation.isPending}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {generateQRMutation.isPending && generateQRMutation.variables === product.id
                      ? 'Generating...'
                      : 'Generate QR Code'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* QR Modal */}
      {selectedProduct && qrData && (
        <QRModal
          isOpen={true}
          onClose={handleCloseModal}
          product={selectedProduct}
          qrData={qrData}
        />
      )}
    </div>
  );
};

export default DashboardPage;