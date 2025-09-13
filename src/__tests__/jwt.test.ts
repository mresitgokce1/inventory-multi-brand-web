import { describe, it, expect, vi } from 'vitest';
import { decodeJWT, isTokenExpired, getTokenExpiry, getTimeUntilExpiry } from '../utils/jwt';

describe('JWT Utils', () => {
  // Mock JWT token with known payload
  // Header: {"alg":"HS256","typ":"JWT"}
  // Payload: {"exp":1234567890,"iat":1234567800,"user_id":1}
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEyMzQ1Njc4OTAsImlhdCI6MTIzNDU2NzgwMCwidXNlcl9pZCI6MX0.signature';
  const mockPayload = {
    exp: 1234567890,
    iat: 1234567800,
    user_id: 1
  };

  it('should decode JWT token correctly', () => {
    const decoded = decodeJWT(mockToken);
    expect(decoded).toEqual(mockPayload);
  });

  it('should return null for invalid token', () => {
    expect(decodeJWT('invalid-token')).toBeNull();
    expect(decodeJWT('')).toBeNull();
    expect(decodeJWT('part1.part2')).toBeNull();
  });

  it('should check if token is expired', () => {
    // Mock current time to be after expiry
    vi.spyOn(Date, 'now').mockReturnValue(1234567891 * 1000);
    expect(isTokenExpired(mockToken)).toBe(true);

    // Mock current time to be before expiry
    vi.spyOn(Date, 'now').mockReturnValue(1234567889 * 1000);
    expect(isTokenExpired(mockToken)).toBe(false);

    vi.restoreAllMocks();
  });

  it('should return null for expired check on invalid token', () => {
    expect(isTokenExpired('invalid')).toBeNull();
  });

  it('should get token expiry time', () => {
    expect(getTokenExpiry(mockToken)).toBe(1234567890 * 1000);
  });

  it('should return null for expiry on invalid token', () => {
    expect(getTokenExpiry('invalid')).toBeNull();
  });

  it('should calculate time until expiry', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234567880 * 1000);
    expect(getTimeUntilExpiry(mockToken)).toBe(10 * 1000); // 10 seconds

    vi.restoreAllMocks();
  });

  it('should return null for time until expiry on invalid token', () => {
    expect(getTimeUntilExpiry('invalid')).toBeNull();
  });
});