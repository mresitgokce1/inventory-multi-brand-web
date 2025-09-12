/**
 * Utility functions for QR code data URL handling
 */

import type { QRCodeResponse } from '../types';

/**
 * Builds a data URL from QR response data
 * @param qrData - QR code response containing image data
 * @returns Data URL string or null if data is invalid
 */
export function buildQRDataURL(qrData: QRCodeResponse): string | null {
  // If we already have a complete data URL, use it as-is
  if (qrData.image_base64?.startsWith('data:')) {
    return qrData.image_base64;
  }

  // Get base64 data with fallback for backward compatibility
  // Check if image_base64 has actual content, not just empty string
  const base64Data = (qrData.image_base64 && qrData.image_base64.trim()) || qrData.qr_code;
  
  if (!base64Data || typeof base64Data !== 'string' || base64Data.trim() === '') {
    console.warn('QR code base64 data is missing or empty', qrData);
    return null;
  }

  // Get mime type with fallback to PNG
  const mimeType = qrData.mime_type || 'image/png';
  
  // Build the data URL
  return `data:${mimeType};base64,${base64Data}`;
}

/**
 * Creates a download filename for QR code images
 * @param productName - Name of the product
 * @param mimeType - MIME type of the image
 * @returns Filename string
 */
export function createQRDownloadFilename(productName: string, mimeType: string = 'image/png'): string {
  // Create a safe filename from product name
  const safeProductName = productName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .slice(0, 50); // Limit length
  
  // Get file extension from mime type
  const extension = mimeType.includes('svg') ? 'svg' : 'png';
  
  return `${safeProductName}-qr.${extension}`;
}