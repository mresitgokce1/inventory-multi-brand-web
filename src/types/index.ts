export interface Brand {
  id: number;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductPublic {
  id: number;
  name: string;
  slug: string;
  price: string; // DRF returns Decimal as string with comma ("232,00")
  image_small_url?: string | null;
  brand: Brand;
  category: Category;
  description?: string;
}

export interface ProductPrivate {
  sku: string;
  stock: number;
}

export interface QRResolveResponse {
  visibility: string;
  product_public: ProductPublic;
  product_private?: ProductPrivate;
}

// For dashboard list view (simplified)
export interface ProductListItem {
  id: string;
  name: string;
  price: string;
  image?: string;
  brand: string;
  category: string;
  description?: string;
}

export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'BRAND_MANAGER' | 'STAFF';
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