import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product';
import { useAuth } from '../hooks/useAuth';
import { hasRoleAccess } from '../utils/roles';
import type { ProductPublic, Category } from '../types';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import ToastContainer from '../components/ToastContainer';
import { formatPrice, normalizePriceForAPI } from '../utils/price';
import { parseError } from '../utils/errors';
import { toast } from '../utils/toast';
import { generateSlug } from '../utils/slug';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    sku: '',
    stock: '',
    description: '',
    slug: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  // Define allowed roles for editing/deleting
  const allowedRoles = ['ADMIN', 'BRAND_MANAGER'];
  const canEditProduct = user && hasRoleAccess(user.role, allowedRoles);

  // Fetch product details
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery<ProductPublic>({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id!),
    enabled: !!id,
  });

  // Fetch categories for the form
  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
    enabled: isEditing,
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (data: FormData) => productService.updateProduct(id!, data),
    onSuccess: () => {
      toast.success('Product updated successfully');
      setIsEditing(false);
      setErrors({});
      setGlobalError('');
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: unknown) => {
      const parsed = parseError(error);
      setGlobalError(parsed.message);
      setErrors(
        Object.fromEntries(
          Object.entries(parsed.fieldErrors).map(([field, messages]) => [
            field,
            messages[0],
          ])
        )
      );
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: () => productService.deleteProduct(id!),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      navigate('/dashboard/products');
    },
    onError: (error: unknown) => {
      const parsed = parseError(error);
      toast.error(parsed.message);
    },
  });

  // Generate QR code mutation
  const generateQRMutation = useMutation({
    mutationFn: () => productService.generateQRCode(id!),
    onSuccess: (data) => {
      // You could open a modal here or trigger a download
      const link = document.createElement('a');
      link.href = `data:${data.mime_type};base64,${data.image_base64}`;
      link.download = `qr-code-${product?.slug || id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR code downloaded');
    },
    onError: (error: unknown) => {
      const parsed = parseError(error);
      toast.error(parsed.message);
    },
  });

  // Initialize form when product data loads
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category?.id?.toString() || '',
        price: product.price || '',
        sku: '', // We don't have SKU in ProductPublic type
        stock: '', // We don't have stock in ProductPublic type
        description: product.description || '',
        slug: product.slug || '',
      });
    }
  }, [product]);

  // Auto-suggest slug from name
  useEffect(() => {
    if (isEditing && formData.name && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.name),
      }));
    }
  }, [formData.name, formData.slug, isEditing]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');

    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('category', formData.category);
    submitData.append('price', normalizePriceForAPI(formData.price));
    
    if (formData.sku.trim()) {
      submitData.append('sku', formData.sku.trim());
    }
    
    if (formData.stock.trim()) {
      submitData.append('stock', formData.stock.trim());
    }
    
    if (formData.description.trim()) {
      submitData.append('description', formData.description.trim());
    }
    
    if (formData.slug.trim()) {
      submitData.append('slug', formData.slug.trim());
    }
    
    if (image) {
      submitData.append('image', image);
    }

    updateProductMutation.mutate(submitData);
  };

  const handleDeleteConfirm = () => {
    deleteProductMutation.mutate();
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-4">
            The product you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => navigate('/dashboard/products')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/products')}
            className="mb-4 text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
          >
            ← Back to Products
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="mt-2 text-gray-600">
                {isEditing ? 'Edit product details' : 'Product information'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => generateQRMutation.mutate()}
                disabled={generateQRMutation.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
              >
                {generateQRMutation.isPending ? 'Generating...' : 'Generate QR'}
              </button>
              {canEditProduct && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Edit Product
                </button>
              )}
              {canEditProduct && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Details/Form */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Global Error */}
              {globalError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{globalError}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.name ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={categoriesLoading}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.category ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price *
                  </label>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    required
                    placeholder="232,00 or 232.00"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.price ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>

                {/* SKU */}
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                    SKU
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.sku ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
                </div>

                {/* Stock */}
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                    Stock *
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.stock ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
                </div>

                {/* Slug */}
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                    Slug
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.slug ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.description ? 'border-red-300' : ''
                  }`}
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Image */}
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                  Product Image
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setErrors({});
                    setGlobalError('');
                    setImage(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProductMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            /* Product Details View */
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div>
                  {product.image_small_url ? (
                    <img
                      src={product.image_small_url}
                      alt={product.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Price</h3>
                    <p className="text-2xl font-bold text-blue-600">{formatPrice(product.price)}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Category</h3>
                    <span className="inline-flex px-2 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                      {product.category.name}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Brand</h3>
                    <p className="text-gray-700">{product.brand.name}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Slug</h3>
                    <p className="text-gray-700 font-mono text-sm">{product.slug}</p>
                  </div>

                  {product.description && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Description</h3>
                      <p className="text-gray-700">{product.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Product"
          message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
          isLoading={deleteProductMutation.isPending}
        />
      )}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default ProductDetailPage;