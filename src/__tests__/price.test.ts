import { describe, it, expect } from 'vitest';
import { formatPrice } from '../utils/price';

describe('formatPrice', () => {
  it('should format string price correctly', () => {
    expect(formatPrice('99.90')).toBe('$99,90');
    expect(formatPrice('123.45')).toBe('$123,45');
    expect(formatPrice('0.50')).toBe('$0,50');
  });

  it('should format number price correctly', () => {
    expect(formatPrice(99.9)).toBe('$99,90');
    expect(formatPrice(123.45)).toBe('$123,45');
    expect(formatPrice(0.5)).toBe('$0,50');
  });

  it('should handle null and undefined gracefully', () => {
    expect(formatPrice(null)).toBe('-');
    expect(formatPrice(undefined)).toBe('-');
  });

  it('should handle invalid string inputs gracefully', () => {
    expect(formatPrice('not-a-number')).toBe('-');
    expect(formatPrice('N/A')).toBe('-');
    expect(formatPrice('')).toBe('-');
    expect(formatPrice('abc123')).toBe('-');
  });

  it('should handle invalid number inputs gracefully', () => {
    expect(formatPrice(NaN)).toBe('-');
    expect(formatPrice(Infinity)).toBe('-');
    expect(formatPrice(-Infinity)).toBe('-');
  });

  it('should handle unexpected input types gracefully', () => {
    expect(formatPrice({} as unknown)).toBe('-');
    expect(formatPrice([] as unknown)).toBe('-');
    expect(formatPrice(true as unknown)).toBe('-');
  });

  it('should support custom currency formatting', () => {
    const result = formatPrice('99.90', 'en-US', 'USD');
    expect(result).toMatch(/\$99\.90/); // Should contain currency symbol and amount
  });

  it('should handle negative prices correctly', () => {
    expect(formatPrice('-10.50')).toBe('$-10,50');
    expect(formatPrice(-10.5)).toBe('$-10,50');
  });

  it('should handle zero price correctly', () => {
    expect(formatPrice('0')).toBe('$0,00');
    expect(formatPrice(0)).toBe('$0,00');
    expect(formatPrice('0.00')).toBe('$0,00');
  });
});