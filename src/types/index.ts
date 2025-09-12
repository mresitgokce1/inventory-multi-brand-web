export interface ProductPublic {
  id: string;
  name: string;
  price: number;
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
  qr_code: string; // base64 PNG
  url: string;
}