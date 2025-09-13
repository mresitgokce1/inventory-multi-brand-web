import { describe, it, expect } from 'vitest';
import { parseError, hasErrors, getFieldError } from '../utils/errors';

describe('Error Parser', () => {
  it('should parse DRF validation errors correctly', () => {
    const error = {
      response: {
        data: {
          name: ['This field is required.'],
          price: ['Enter a valid number.'],
          non_field_errors: ['A product with this name already exists.']
        }
      }
    };

    const parsed = parseError(error);

    expect(parsed.fieldErrors.name).toEqual(['This field is required.']);
    expect(parsed.fieldErrors.price).toEqual(['Enter a valid number.']);
    expect(parsed.globalErrors).toContain('A product with this name already exists.');
  });

  it('should parse DRF detail errors', () => {
    const error = {
      response: {
        data: {
          detail: 'Not found.'
        }
      }
    };

    const parsed = parseError(error);
    
    expect(parsed.message).toBe('Not found.');
    expect(parsed.globalErrors).toContain('Not found.');
  });

  it('should parse custom envelope format', () => {
    const error = {
      response: {
        data: {
          error: {
            status: 400,
            message: 'Validation failed',
            details: {
              name: ['Name is required'],
              email: ['Invalid email format']
            }
          }
        }
      }
    };

    const parsed = parseError(error);
    
    expect(parsed.message).toBe('Validation failed');
    expect(parsed.fieldErrors.name).toEqual(['Name is required']);
    expect(parsed.fieldErrors.email).toEqual(['Invalid email format']);
  });

  it('should handle generic errors', () => {
    const error = new Error('Network error');
    const parsed = parseError(error);
    
    expect(parsed.message).toBe('Network error');
    expect(parsed.globalErrors).toContain('Network error');
  });

  it('should return field errors correctly', () => {
    const parsed = parseError({
      response: {
        data: {
          name: ['This field is required.'],
          price: ['Invalid price', 'Must be positive']
        }
      }
    });

    expect(getFieldError(parsed, 'name')).toBe('This field is required.');
    expect(getFieldError(parsed, 'price')).toBe('Invalid price');
    expect(getFieldError(parsed, 'nonexistent')).toBeUndefined();
  });

  it('should check for errors correctly', () => {
    const errorResponse = parseError({
      response: {
        data: {
          name: ['Required']
        }
      }
    });

    const noErrors = parseError({});

    expect(hasErrors(errorResponse)).toBe(true);
    expect(hasErrors(noErrors)).toBe(true); // Because it has a default message
  });
});