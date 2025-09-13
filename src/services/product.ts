import apiClient from './auth';
import type { QRResolveResponse, QRCodeResponse, ProductListItem, Category } from '../types';

export const productService = {
  async resolveQR(code: string): Promise<QRResolveResponse> {
    const response = await apiClient.get(`/api/qr/resolve/${code}`);
    return response.data;
  },

  async getProducts(): Promise<ProductListItem[]> {
    const response = await apiClient.get('/api/products');
    // Handle DRF pagination if present (data.results vs data)
    const products = response.data.results || response.data;
    
    // Convert to simplified format for dashboard view
    return products.map((product: {
      id: number;
      name: string;
      price: string;
      image_small_url?: string;
      brand: { name: string } | string;
      category: { name: string } | string;
      description?: string;
    }) => ({
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      image: product.image_small_url,
      brand: typeof product.brand === 'object' ? product.brand.name : product.brand,
      category: typeof product.category === 'object' ? product.category.name : product.category,
      description: product.description,
    }));
  },

  async generateQRCode(productId: string): Promise<QRCodeResponse> {
    const response = await apiClient.post(`/api/products/${productId}/qr-code/`);
    return response.data;
  },

  async createProduct(productData: FormData): Promise<unknown> {
    const response = await apiClient.post('/api/products/', productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get('/api/categories/');
    // Handle DRF pagination if present
    return response.data.results || response.data;
  },

  async createCategory(categoryData: { name: string; slug?: string }): Promise<Category> {
    const response = await apiClient.post('/api/categories/', categoryData);
    return response.data;
  },
};