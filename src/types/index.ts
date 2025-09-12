export interface ProductPublic {
  id: string;
  name: string;
  price: string; // DRF returns Decimal as string
  image?: string;
  brand: string;
  category: string;
  description?: string;
}

export interface ProductPrivate {
  sku: string;
  stock: number;
}

export interface QRResolveResponse {
  product_public: ProductPublic;
  product_private?: ProductPrivate;
}

export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'MANAGER';
  brand_id: number | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  user: User;
}

export interface QRCodeResponse {
  code: string;
  url: string;
  image_base64: string;
  mime_type: string;
  // Legacy compatibility fields
  qr_code?: string; // Fallback for backward compatibility
}