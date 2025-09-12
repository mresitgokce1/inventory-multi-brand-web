import { describe, it, expect, vi } from 'vitest';
import { buildQRDataURL, createQRDownloadFilename } from '../utils/qr';
import type { QRCodeResponse } from '../types';

describe('QR Utility Functions', () => {
  describe('buildQRDataURL', () => {
    it('should build data URL from image_base64 and mime_type', () => {
      const qrData: QRCodeResponse = {
        code: 'ABC123',
        url: 'https://example.com/p/ABC123',
        image_base64: 'iVBORw0KGgoAAAANSUhEUgAA',
        mime_type: 'image/png'
      };

      const result = buildQRDataURL(qrData);
      expect(result).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA');
    });

    it('should handle SVG mime type correctly', () => {
      const qrData: QRCodeResponse = {
        code: 'SVG123',
        url: 'https://example.com/p/SVG123',
        image_base64: '<svg>test</svg>',
        mime_type: 'image/svg+xml'
      };

      const result = buildQRDataURL(qrData);
      expect(result).toBe('data:image/svg+xml;base64,<svg>test</svg>');
    });

    it('should return data URL as-is if already prefixed', () => {
      const qrData: QRCodeResponse = {
        code: 'DATA123',
        url: 'https://example.com/p/DATA123',
        image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA',
        mime_type: 'image/png'
      };

      const result = buildQRDataURL(qrData);
      expect(result).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA');
    });

    it('should fall back to qr_code field for backward compatibility', () => {
      const qrData: QRCodeResponse = {
        code: 'LEGACY123',
        url: 'https://example.com/p/LEGACY123',
        image_base64: '',
        mime_type: 'image/png',
        qr_code: 'legacyBase64Data'
      };

      const result = buildQRDataURL(qrData);
      expect(result).toBe('data:image/png;base64,legacyBase64Data');
    });

    it('should use default mime type when not provided', () => {
      const qrData: QRCodeResponse = {
        code: 'NOMIME123',
        url: 'https://example.com/p/NOMIME123',
        image_base64: 'testBase64',
        mime_type: ''
      };

      const result = buildQRDataURL(qrData);
      expect(result).toBe('data:image/png;base64,testBase64');
    });

    it('should return null and log warning for missing base64 data', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const qrData: QRCodeResponse = {
        code: 'EMPTY123',
        url: 'https://example.com/p/EMPTY123',
        image_base64: '',
        mime_type: 'image/png'
      };

      const result = buildQRDataURL(qrData);
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'QR code base64 data is missing or empty',
        qrData
      );

      consoleSpy.mockRestore();
    });

    it('should return null for undefined base64 data', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const qrData: QRCodeResponse = {
        code: 'UNDEF123',
        url: 'https://example.com/p/UNDEF123',
        image_base64: undefined!,
        mime_type: 'image/png'
      };

      const result = buildQRDataURL(qrData);
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle whitespace-only base64 data', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const qrData: QRCodeResponse = {
        code: 'SPACE123',
        url: 'https://example.com/p/SPACE123',
        image_base64: '   ',
        mime_type: 'image/png'
      };

      const result = buildQRDataURL(qrData);
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('createQRDownloadFilename', () => {
    it('should create safe filename for PNG', () => {
      const result = createQRDownloadFilename('Product Name', 'image/png');
      expect(result).toBe('product-name-qr.png');
    });

    it('should create safe filename for SVG', () => {
      const result = createQRDownloadFilename('Test Product', 'image/svg+xml');
      expect(result).toBe('test-product-qr.svg');
    });

    it('should handle special characters in product name', () => {
      const result = createQRDownloadFilename('Product (2024) - Special & Chars!', 'image/png');
      expect(result).toBe('product-2024-special-chars-qr.png');
    });

    it('should handle multiple spaces and hyphens', () => {
      const result = createQRDownloadFilename('Product    with   many    spaces', 'image/png');
      expect(result).toBe('product-with-many-spaces-qr.png');
    });

    it('should truncate long product names', () => {
      const longName = 'This is a very long product name that should be truncated at some point to avoid extremely long filenames';
      const result = createQRDownloadFilename(longName, 'image/png');
      expect(result.length).toBeLessThanOrEqual(57); // 50 chars + '-qr.png' = 57
      expect(result).toMatch(/^this-is-a-very-long-product-name-that-should-be-tr-qr\.png$/);
    });

    it('should default to PNG extension for unknown mime types', () => {
      const result = createQRDownloadFilename('Test Product', 'application/octet-stream');
      expect(result).toBe('test-product-qr.png');
    });

    it('should use default mime type when not provided', () => {
      const result = createQRDownloadFilename('Test Product');
      expect(result).toBe('test-product-qr.png');
    });
  });
});