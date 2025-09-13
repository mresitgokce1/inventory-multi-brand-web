/**
 * Role constants and normalization utilities for RBAC
 */

// Define all supported roles as constants
export const ROLES = {
  ADMIN: 'ADMIN',
  BRAND_MANAGER: 'BRAND_MANAGER', 
  MANAGER: 'MANAGER', // Alias for BRAND_MANAGER
  STAFF: 'STAFF',
} as const;

// Type for valid roles
export type Role = typeof ROLES[keyof typeof ROLES];

// Role aliases mapping - maps alias roles to their canonical form
const ROLE_ALIASES: Record<string, Role> = {
  'MANAGER': ROLES.BRAND_MANAGER,
  'Manager': ROLES.BRAND_MANAGER,
  'manager': ROLES.BRAND_MANAGER,
  'BRAND_MANAGER': ROLES.BRAND_MANAGER,
  'Brand_Manager': ROLES.BRAND_MANAGER,
  'brand_manager': ROLES.BRAND_MANAGER,
  'ADMIN': ROLES.ADMIN,
  'Admin': ROLES.ADMIN,
  'admin': ROLES.ADMIN,
  'STAFF': ROLES.STAFF,
  'Staff': ROLES.STAFF,
  'staff': ROLES.STAFF,
};

/**
 * Normalizes a role string to its canonical form
 * - Trims whitespace
 * - Converts to uppercase 
 * - Maps known aliases to canonical roles
 * - Returns the normalized role or the original if not recognized
 */
export function normalizeRole(role: string | undefined | null): string {
  if (!role || typeof role !== 'string') {
    return '';
  }
  
  const trimmed = role.trim();
  if (trimmed === '') {
    return '';
  }
  
  // Check if it's a known alias
  const aliasResult = ROLE_ALIASES[trimmed];
  if (aliasResult) {
    return aliasResult;
  }
  
  // Return uppercase version as fallback
  return trimmed.toUpperCase();
}

/**
 * Checks if a role has access to a specific set of allowed roles
 * Performs normalization on both the user role and allowed roles
 */
export function hasRoleAccess(userRole: string | undefined | null, allowedRoles: string[]): boolean {
  const normalizedUserRole = normalizeRole(userRole);
  if (!normalizedUserRole) {
    return false;
  }
  
  const normalizedAllowedRoles = allowedRoles.map(role => normalizeRole(role));
  return normalizedAllowedRoles.includes(normalizedUserRole);
}