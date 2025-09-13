/**
 * JWT utility functions for client-side token handling
 * Note: This is only for reading token metadata (exp), not for validation
 */

export interface JWTPayload {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Decode JWT token payload (client-side only, no validation)
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT has 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64 and parse JSON
    const decodedPayload = atob(paddedPayload);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.warn('Failed to decode JWT token:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param token JWT token string
 * @returns true if expired, false if valid, null if can't determine
 */
export function isTokenExpired(token: string): boolean | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null; // Can't determine expiry
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Get token expiry time in milliseconds
 * @param token JWT token string
 * @returns Expiry timestamp in ms, or null if can't determine
 */
export function getTokenExpiry(token: string): number | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return payload.exp * 1000; // Convert to milliseconds
}

/**
 * Calculate milliseconds until token expires
 * @param token JWT token string
 * @returns Milliseconds until expiry, or null if can't determine
 */
export function getTimeUntilExpiry(token: string): number | null {
  const expiryTime = getTokenExpiry(token);
  if (!expiryTime) {
    return null;
  }

  return expiryTime - Date.now();
}