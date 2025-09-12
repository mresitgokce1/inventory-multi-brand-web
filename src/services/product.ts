import apiClient from './auth';
import type { QRResolveResponse, QRCodeResponse, ProductPublic } from '../types';

export const productService = {
  async resolveQR(code: string): Promise<QRResolveResponse> {
    const response = await apiClient.get(`/api/qr/resolve/${code}`);
    return response.data;
  },

  async getProducts(): Promise<ProductPublic[]> {
    const response = await apiClient.get('/api/products');
    return response.data;
  },

  async generateQRCode(productId: string): Promise<QRCodeResponse> {
    const response = await apiClient.post(`/api/products/${productId}/qr-code`);
    return response.data;
  },
};