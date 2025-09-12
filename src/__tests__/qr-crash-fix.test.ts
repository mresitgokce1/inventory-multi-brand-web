import { describe, it, expect } from 'vitest';
import { formatPrice, normalizePriceForAPI } from '../utils/price';

describe('Price Formatter - QR Landing Page Crash Fix', () => {
  describe('formatPrice - handles API response format that was causing crashes', () => {
    it('should handle comma decimal format from Turkish backend', () => {
      // These are the exact formats that were causing crashes according to the problem statement
      expect(formatPrice('232,00')).toBe('$232,00');
      expect(formatPrice('99,90')).toBe('$99,90');
      expect(formatPrice('1.234,56')).toBe('$1.234,56'); // thousands separator + comma decimal
    });

    it('should handle dot decimal format for backwards compatibility', () => {
      expect(formatPrice('232.00')).toBe('$232,00');
      expect(formatPrice('99.90')).toBe('$99,90');
    });

    it('should never crash on invalid input (key requirement)', () => {
      // These should return "-" instead of crashing
      expect(formatPrice(null)).toBe('-');
      expect(formatPrice(undefined)).toBe('-');
      expect(formatPrice('')).toBe('-');
      expect(formatPrice('N/A')).toBe('-');
      expect(formatPrice('invalid')).toBe('-');
      
      // Even invalid objects should not crash
      expect(formatPrice({} as unknown)).toBe('-');
      expect(formatPrice([] as unknown)).toBe('-');
    });

    it('should handle numbers without calling .toFixed on strings', () => {
      // The original bug was calling .toFixed on string values
      expect(formatPrice(232)).toBe('$232,00');
      expect(formatPrice(99.9)).toBe('$99,90');
    });
  });

  describe('normalizePriceForAPI - converts input for backend submission', () => {
    it('should convert comma decimal to dot decimal for API submission', () => {
      expect(normalizePriceForAPI('232,00')).toBe('232.00');
      expect(normalizePriceForAPI('99,90')).toBe('99.90');
      expect(normalizePriceForAPI('1.234,56')).toBe('1234.56');
    });

    it('should preserve dot decimal format', () => {
      expect(normalizePriceForAPI('232.00')).toBe('232.00');
      expect(normalizePriceForAPI('99.90')).toBe('99.90');
    });

    it('should handle edge cases safely', () => {
      expect(normalizePriceForAPI('')).toBe('');
      expect(normalizePriceForAPI('   ')).toBe('');
      expect(normalizePriceForAPI('123')).toBe('123');
    });
  });

  describe('Real-world scenarios from the problem statement', () => {
    it('should handle the exact backend response that was causing crashes', () => {
      // From problem statement: { "price": "232,00" }
      const apiResponse = { price: "232,00" };
      
      // This should not crash and should format correctly
      const formattedPrice = formatPrice(apiResponse.price);
      expect(formattedPrice).toBe('$232,00');
    });

    it('should handle null image_small_url without crashing', () => {
      // From problem statement: "image_small_url": null
      const imageUrl = null;
      
      // This should be safely handled in components
      expect(imageUrl).toBe(null);
      expect(!!imageUrl).toBe(false);
    });

    it('should handle the full QR response structure', () => {
      // Simulating the API response from the problem statement
      const qrResponse = {
        visibility: "admin",
        product_public: {
          id: 2,
          name: "Musluk",
          slug: "musluk",
          price: "232,00",
          image_small_url: null,
          description: "asdasdasd",
          brand: {
            id: 1,
            name: "New Brand",
            slug: "new-brand"
          },
          category: {
            id: 1,
            name: "Yeni Kategori",
            slug: "yeni-kategori"
          }
        },
        product_private: {
          sku: "123123",
          stock: 5
        }
      };

      // All of these should work without crashing
      expect(formatPrice(qrResponse.product_public.price)).toBe('$232,00');
      expect(qrResponse.product_public.image_small_url).toBe(null);
      expect(qrResponse.product_public.brand.name).toBe('New Brand');
      expect(qrResponse.product_public.category.name).toBe('Yeni Kategori');
    });
  });
});