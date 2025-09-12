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
  id: string;
  email: string;
  role: 'manager' | 'admin';
  brand: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface QRCodeResponse {
  qr_code: string; // base64 PNG
  url: string;
}