import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/product';
import { generateSlug } from '../utils/slug';
import { normalizePriceForAPI } from '../utils/price';
import { parseError } from '../utils/errors';
import { toast } from '../utils/toast';
import type { Category } from '../types';

const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
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
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  // Fetch categories for the dropdown
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  const createProductMutation = useMutation({
    mutationFn: (data: FormData) => productService.createProduct(data),
    onSuccess: (data: unknown) => {
      const productData = data as { name?: string };
      toast.success(`Product "${productData.name || 'New product'}" created successfully!`);
      navigate('/dashboard/products');
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

  // Auto-generate slug when name changes (unless manually edited)
  useEffect(() => {
    if (!slugManuallyEdited && formData.name) {
      setFormData(prev => ({ ...prev, slug: generateSlug(formData.name) }));
    }
  }, [formData.name, slugManuallyEdited]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Track if slug is manually edited
    if (name === 'slug') {
      setSlugManuallyEdited(true);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImage(file || null);
    
    // Clear image error
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else {
      // Validate price format
      const normalizedPrice = normalizePriceForAPI(formData.price);
      const priceNum = parseFloat(normalizedPrice);
      if (isNaN(priceNum) || priceNum < 0) {
        newErrors.price = 'Please enter a valid price (e.g., 232,00 or 232.00)';
      }
    }
    
    if (!formData.stock.trim()) {
      newErrors.stock = 'Stock quantity is required';
    } else {
      const stockNum = parseInt(formData.stock);
      if (isNaN(stockNum) || stockNum < 0) {
        newErrors.stock = 'Stock must be a non-negative number';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare FormData for submission
    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('category', formData.category);
    submitData.append('price', normalizePriceForAPI(formData.price));
    submitData.append('stock', formData.stock);
    
    if (formData.sku.trim()) {
      submitData.append('sku', formData.sku.trim());
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

    createProductMutation.mutate(submitData);
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Categories</h1>
          <p className="text-gray-600 mb-4">
            Unable to load categories. Please try again or create a category first.
          </p>
          <div className="space-x-3">
            <button
              onClick={() => navigate('/dashboard/categories/new')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Create Category
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/products')}
            className="mb-4 text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
          <p className="mt-2 text-gray-600">
            Add a new product to your inventory with all the necessary details.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {globalError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{globalError}</div>
              </div>
            )}

            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., iPhone 13 Pro, Nike Air Max, Samsung TV"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
              {(!categories || categories.length === 0) && (
                <p className="mt-1 text-sm text-orange-600">
                  No categories available. 
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/categories/new')}
                    className="text-blue-600 hover:text-blue-800 underline ml-1"
                  >
                    Create one first
                  </button>
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="232,00 or 232.00"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter price in Turkish format (232,00) or international format (232.00)
              </p>
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            {/* SKU */}
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                SKU (Stock Keeping Unit)
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.sku ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., IPHONE-13-PRO-256GB"
              />
              {errors.sku && (
                <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
              )}
            </div>

            {/* Stock */}
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.stock ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Detailed product description..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Image */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                Product Image
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.image ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload a product image (JPEG, PNG, WebP supported)
              </p>
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug (optional)
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.slug ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="auto-generated-from-name"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to auto-generate from the product name. Only letters, numbers, and hyphens allowed.
              </p>
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/products')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createProductMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProductPage;