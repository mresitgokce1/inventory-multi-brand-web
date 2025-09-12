import { describe, it, expect } from 'vitest';
import { formatPrice, normalizePriceForAPI } from '../utils/price';

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

  it('should handle comma decimal format (Turkish format)', () => {
    expect(formatPrice('232,00')).toBe('$232,00');
    expect(formatPrice('1.234,56')).toBe('$1.234,56');
    expect(formatPrice('99,90')).toBe('$99,90');
  });

  it('should handle thousands separators correctly', () => {
    expect(formatPrice('1.000,50')).toBe('$1.000,50');
    expect(formatPrice('10.000,00')).toBe('$10.000,00');
  });
});

describe('normalizePriceForAPI', () => {
  it('should convert comma decimal to dot decimal', () => {
    expect(normalizePriceForAPI('232,00')).toBe('232.00');
    expect(normalizePriceForAPI('99,90')).toBe('99.90');
    expect(normalizePriceForAPI('0,50')).toBe('0.50');
  });

  it('should handle thousands separators with comma decimal', () => {
    expect(normalizePriceForAPI('1.000,50')).toBe('1000.50');
    expect(normalizePriceForAPI('10.000,00')).toBe('10000.00');
  });

  it('should leave dot decimal format unchanged', () => {
    expect(normalizePriceForAPI('232.00')).toBe('232.00');
    expect(normalizePriceForAPI('99.90')).toBe('99.90');
  });

  it('should handle edge cases', () => {
    expect(normalizePriceForAPI('')).toBe('');
    expect(normalizePriceForAPI('   ')).toBe('');
    expect(normalizePriceForAPI('123')).toBe('123');
  });

  it('should handle non-string inputs gracefully', () => {
    expect(normalizePriceForAPI(null as unknown as string)).toBe(null);
    expect(normalizePriceForAPI(undefined as unknown as string)).toBe(undefined);
  });
});