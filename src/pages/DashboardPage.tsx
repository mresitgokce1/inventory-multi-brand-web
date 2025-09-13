// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productService } from '../services/product';
import type { ProductsQueryParams, ProductsListResponse } from '../services/product';
import { useAuth } from '../hooks/useAuth';
import { hasRoleAccess } from '../utils/roles';
import type { ProductListItem, QRCodeResponse } from '../types';
import QRModal from '../components/QRModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import ToastContainer from '../components/ToastContainer';
import { formatPrice } from '../utils/price';
import { parseError } from '../utils/errors';
import { toast } from '../utils/toast';
import { authService } from '../services/auth.ts';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // QR generation state
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [qrData, setQrData] = useState<QRCodeResponse | null>(null);

  // Delete confirmation state
  const [deleteProduct, setDeleteProduct] = useState<ProductListItem | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Allowed roles
  const allowedRoles = ['ADMIN', 'BRAND_MANAGER'];
  const canAddProduct = !!(user && hasRoleAccess(user.role, allowedRoles));

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reflect debounced search in URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
      params.set('page', '1');
    } else {
      params.delete('search');
    }
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, setSearchParams, searchParams]);

  // Parse query parameters
  const queryParams: ProductsQueryParams = {
    page: parseInt(searchParams.get('page') || '1'),
    page_size: parseInt(searchParams.get('page_size') || '20'),
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    ordering: searchParams.get('ordering') || undefined,
  };

  const {
    data: productsResponse,
    isLoading,
    error,
  } = useQuery<ProductsListResponse>({
    queryKey: ['products', queryParams],
    queryFn: () => productService.getProducts(queryParams),
  });

  const products = productsResponse?.results || [];
  const totalCount = productsResponse?.count || 0;
  const hasNextPage = !!productsResponse?.next;
  const hasPreviousPage = !!productsResponse?.previous;

  const generateQRMutation = useMutation({
    mutationFn: (productId: string) => productService.generateQRCode(productId),
    onSuccess: (data, productId) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        setQrData(data);
      }
    },
    onError: (err: unknown) => {
      const parsed = parseError(err);
      toast.error(parsed.message);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => productService.deleteProduct(productId),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      setDeleteProduct(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: unknown) => {
      const parsed = parseError(err);
      toast.error(parsed.message);
    },
  });

  const handleGenerateQR = (product: ProductListItem) => {
    generateQRMutation.mutate(product.id);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setQrData(null);
  };

  const handleDeleteClick = (product: ProductListItem) => {
    setDeleteProduct(product);
  };

  const handleDeleteConfirm = () => {
    if (deleteProduct) deleteProductMutation.mutate(deleteProduct.id);
  };

  const handleDeleteCancel = () => setDeleteProduct(null);

  const handleViewProduct = (product: ProductListItem) => {
    navigate(`/dashboard/products/${product.id}`);
  };

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams);
    const current = params.get('ordering');
    if (current === field) params.set('ordering', `-${field}`);
    else if (current === `-${field}`) params.delete('ordering');
    else params.set('ordering', field);
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const getSortIcon = (field: string) => {
    const ordering = searchParams.get('ordering');
    if (ordering === field) return '↑';
    if (ordering === `-${field}`) return '↓';
    return '↕';
    };

  const handleLogout = () => {
    authService.logout();
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
          <p className="text-gray-600 mb-4">Unable to retrieve your products. Please try again.</p>
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
                Welcome back, {user?.email}
                {user?.brand_id ? ` (Brand ID: ${user.brand_id})` : ' (Global Admin)'}
              </p>
            </div>
            <div className="flex gap-3">
              {canAddProduct && (
                <>
                  <a
                    href="/dashboard/categories/new"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
                  >
                    Add Category
                  </a>
                  <a
                    href="/dashboard/products/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Add Product
                  </a>
                </>
              )}
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Your Products</h2>
            <p className="text-sm text-gray-600">
              Manage your product inventory with search, filters, and bulk actions.
            </p>
          </div>

          {/* Search */}
          <div className="mt-4 sm:mt-0 flex gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {!products || products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No products match your search criteria.' : "You don't have any products yet."}
            </p>
            {canAddProduct && (
              <button
                onClick={() => navigate('/dashboard/products/new')}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
              >
                {searchTerm ? 'Clear Search' : 'Create Your First Product'}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        Name {getSortIcon('name')}
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('sku')}
                      >
                        SKU {getSortIcon('sku')}
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('price')}
                      >
                        Price {getSortIcon('price')}
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('stock')}
                      >
                        Stock {getSortIcon('stock')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updated_at')}
                      >
                        Updated {getSortIcon('updated_at')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.image && (
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={product.image}
                                  alt={product.name}
                                />
                              </div>
                            )}
                            <div className={product.image ? 'ml-4' : ''}>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              {product.description && (
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.stock ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.brand}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewProduct(product)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm"
                            >
                              View/Edit
                            </button>
                            <button
                              onClick={() => handleGenerateQR(product)}
                              disabled={generateQRMutation.isPending}
                              className="text-blue-600 hover:text-blue-900 text-sm disabled:opacity-50"
                            >
                              QR Code
                            </button>
                            {canAddProduct && (
                              <button
                                onClick={() => handleDeleteClick(product)}
                                className="text-red-600 hover:text-red-900 text-sm"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalCount > (queryParams.page_size || 20) && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((queryParams.page || 1) - 1) * (queryParams.page_size || 20) + 1} to{' '}
                  {Math.min((queryParams.page || 1) * (queryParams.page_size || 20), totalCount)} of{' '}
                  {totalCount} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange((queryParams.page || 1) - 1)}
                    disabled={!hasPreviousPage}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-700">
                    Page {queryParams.page}
                  </span>
                  <button
                    onClick={() => handlePageChange((queryParams.page || 1) + 1)}
                    disabled={!hasNextPage}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
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

      {/* Delete Confirmation Modal */}
      {deleteProduct && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteProduct.name}"? This action cannot be undone.`}
          isLoading={deleteProductMutation.isPending}
        />
      )}

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
};

export default DashboardPage;
