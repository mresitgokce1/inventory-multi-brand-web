import { describe, it, expect } from 'vitest';
import { generateSlug } from '../utils/slug';

describe('generateSlug', () => {
  it('should generate slug from basic text', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
    expect(generateSlug('Test Product')).toBe('test-product');
  });

  it('should handle Turkish characters', () => {
    expect(generateSlug('Çağrı Şeker')).toBe('cagri-seker');
    expect(generateSlug('İstanbul Ğöl')).toBe('istanbul-gol');
    expect(generateSlug('Üzüm Ürünü')).toBe('uzum-urunu');
  });

  it('should handle special characters and numbers', () => {
    expect(generateSlug('Product #123')).toBe('product-123');
    expect(generateSlug('Test & Product!')).toBe('test-product');
    expect(generateSlug('Price: $29.99')).toBe('price-29-99');
  });

  it('should handle edge cases', () => {
    expect(generateSlug('')).toBe('');
    expect(generateSlug('   ')).toBe('');
    expect(generateSlug('---')).toBe('');
    expect(generateSlug('multiple    spaces')).toBe('multiple-spaces');
  });

  it('should handle non-string inputs gracefully', () => {
    expect(generateSlug(null as unknown as string)).toBe('');
    expect(generateSlug(undefined as unknown as string)).toBe('');
    expect(generateSlug(123 as unknown as string)).toBe('');
  });

  it('should remove consecutive hyphens', () => {
    expect(generateSlug('test---product')).toBe('test-product');
    expect(generateSlug('multiple!!special@@chars')).toBe('multiple-special-chars');
  });

  it('should handle mixed case and trim', () => {
    expect(generateSlug('  Test Product  ')).toBe('test-product');
    expect(generateSlug('CamelCase')).toBe('camelcase');
  });
});