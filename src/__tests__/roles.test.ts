import { describe, it, expect } from 'vitest';
import { normalizeRole, hasRoleAccess, ROLES } from '../utils/roles';

describe('Role Normalization', () => {
  describe('normalizeRole', () => {
    it('should normalize BRAND_MANAGER role variations', () => {
      expect(normalizeRole('BRAND_MANAGER')).toBe('BRAND_MANAGER');
      expect(normalizeRole('Brand_Manager')).toBe('BRAND_MANAGER');
      expect(normalizeRole('brand_manager')).toBe('BRAND_MANAGER');
    });

    it('should normalize MANAGER role to BRAND_MANAGER (alias)', () => {
      expect(normalizeRole('MANAGER')).toBe('BRAND_MANAGER');
      expect(normalizeRole('Manager')).toBe('BRAND_MANAGER');
      expect(normalizeRole('manager')).toBe('BRAND_MANAGER');
    });

    it('should normalize ADMIN role variations', () => {
      expect(normalizeRole('ADMIN')).toBe('ADMIN');
      expect(normalizeRole('Admin')).toBe('ADMIN');
      expect(normalizeRole('admin')).toBe('ADMIN');
    });

    it('should normalize STAFF role variations', () => {
      expect(normalizeRole('STAFF')).toBe('STAFF');
      expect(normalizeRole('Staff')).toBe('STAFF');
      expect(normalizeRole('staff')).toBe('STAFF');
    });

    it('should handle whitespace', () => {
      expect(normalizeRole(' BRAND_MANAGER ')).toBe('BRAND_MANAGER');
      expect(normalizeRole(' manager ')).toBe('BRAND_MANAGER');
      expect(normalizeRole('  ADMIN  ')).toBe('ADMIN');
    });

    it('should handle null/undefined/empty values', () => {
      expect(normalizeRole(null)).toBe('');
      expect(normalizeRole(undefined)).toBe('');
      expect(normalizeRole('')).toBe('');
      expect(normalizeRole('   ')).toBe('');
    });

    it('should handle unknown roles by uppercasing', () => {
      expect(normalizeRole('unknown_role')).toBe('UNKNOWN_ROLE');
      expect(normalizeRole('custom_role')).toBe('CUSTOM_ROLE');
    });
  });

  describe('hasRoleAccess', () => {
    it('should allow BRAND_MANAGER access to dashboard routes', () => {
      expect(hasRoleAccess('BRAND_MANAGER', ['ADMIN', 'BRAND_MANAGER'])).toBe(true);
      expect(hasRoleAccess('brand_manager', ['ADMIN', 'BRAND_MANAGER'])).toBe(true);
    });

    it('should allow MANAGER (alias) access to dashboard routes', () => {
      expect(hasRoleAccess('MANAGER', ['ADMIN', 'BRAND_MANAGER'])).toBe(true);
      expect(hasRoleAccess('manager', ['ADMIN', 'BRAND_MANAGER'])).toBe(true);
    });

    it('should allow ADMIN access even with mixed case', () => {
      expect(hasRoleAccess('ADMIN', ['admin', 'brand_manager'])).toBe(true);
      expect(hasRoleAccess('admin', ['ADMIN', 'BRAND_MANAGER'])).toBe(true);
    });

    it('should deny STAFF access to admin/manager routes', () => {
      expect(hasRoleAccess('STAFF', ['ADMIN', 'BRAND_MANAGER'])).toBe(false);
      expect(hasRoleAccess('staff', ['ADMIN', 'BRAND_MANAGER'])).toBe(false);
    });

    it('should handle null/undefined user roles', () => {
      expect(hasRoleAccess(null, ['ADMIN', 'BRAND_MANAGER'])).toBe(false);
      expect(hasRoleAccess(undefined, ['ADMIN', 'BRAND_MANAGER'])).toBe(false);
      expect(hasRoleAccess('', ['ADMIN', 'BRAND_MANAGER'])).toBe(false);
    });

    it('should normalize both user role and allowed roles', () => {
      expect(hasRoleAccess('manager', ['ADMIN', 'brand_manager'])).toBe(true);
      expect(hasRoleAccess('BRAND_MANAGER', ['admin', 'manager'])).toBe(true);
    });
  });

  describe('ROLES constants', () => {
    it('should have correct role constants', () => {
      expect(ROLES.ADMIN).toBe('ADMIN');
      expect(ROLES.BRAND_MANAGER).toBe('BRAND_MANAGER');
      expect(ROLES.MANAGER).toBe('MANAGER');
      expect(ROLES.STAFF).toBe('STAFF');
    });
  });
});