import apiClient from './auth';
import type { QRResolveResponse, QRCodeResponse, ProductListItem, Category, ProductPublic } from '../types';

export interface ProductsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductListItem[];
}

export interface ProductsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  brand?: string;
  ordering?: string;
  min_price?: number;
  max_price?: number;
}

export const productService = {
  async resolveQR(code: string): Promise<QRResolveResponse> {
    const response = await apiClient.get(`/api/qr/resolve/${code}`);
    return response.data;
  },

  async getProducts(params?: ProductsQueryParams): Promise<ProductsListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const url = `/api/products${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await apiClient.get(url);
    
    // Handle DRF pagination format
    if (response.data.results) {
      return {
        count: response.data.count || 0,
        next: response.data.next || null,
        previous: response.data.previous || null,
        results: response.data.results.map((product: {
          id: number;
          name: string;
          price: string;
          sku?: string;
          stock?: number;
          image_small_url?: string;
          brand: { name: string } | string;
          category: { name: string } | string;
          description?: string;
          updated_at?: string;
        }) => ({
          id: product.id.toString(),
          name: product.name,
          price: product.price,
          sku: product.sku || '',
          stock: product.stock || 0,
          image: product.image_small_url,
          brand: typeof product.brand === 'object' ? product.brand.name : product.brand,
          category: typeof product.category === 'object' ? product.category.name : product.category,
          description: product.description,
          updatedAt: product.updated_at,
        }))
      };
    }
    
    // Fallback for non-paginated response
    const products = Array.isArray(response.data) ? response.data : [];
    return {
      count: products.length,
      next: null,
      previous: null,
      results: products.map((product: {
        id: number;
        name: string;
        price: string;
        sku?: string;
        stock?: number;
        image_small_url?: string;
        brand: { name: string } | string;
        category: { name: string } | string;
        description?: string;
        updated_at?: string;
      }) => ({
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        sku: product.sku || '',
        stock: product.stock || 0,
        image: product.image_small_url,
        brand: typeof product.brand === 'object' ? product.brand.name : product.brand,
        category: typeof product.category === 'object' ? product.category.name : product.category,
        description: product.description,
        updatedAt: product.updated_at,
      }))
    };
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

  async getProduct(id: string): Promise<ProductPublic> {
    const response = await apiClient.get(`/api/products/${id}`);
    return response.data;
  },

  async updateProduct(id: string, productData: FormData): Promise<ProductPublic> {
    const response = await apiClient.patch(`/api/products/${id}`, productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/api/products/${id}`);
  },
};