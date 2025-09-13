/**
 * Unified error handling utilities for parsing backend errors
 * Handles DRF validation errors, custom envelopes, and generic errors
 */

export interface ParsedError {
  fieldErrors: Record<string, string[]>;
  globalErrors: string[];
  message: string;
}

/**
 * Parses various error response formats into a unified structure
 */
export function parseError(error: unknown): ParsedError {
  const result: ParsedError = {
    fieldErrors: {},
    globalErrors: [],
    message: 'An unexpected error occurred',
  };

  // Handle axios error structure
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: unknown; status?: number } };
    const responseData = axiosError.response?.data;

    if (!responseData || typeof responseData !== 'object') {
      result.message = `Server error (${axiosError.response?.status || 'unknown'})`;
      result.globalErrors.push(result.message);
      return result;
    }

    // Try to parse preferred envelope format first
    if ('error' in responseData) {
      const envelope = responseData as {
        error: {
          status?: number;
          code?: string;
          message?: string;
          details?: Record<string, string[]>;
          request_id?: string;
          ts?: string;
        };
      };
      
      if (envelope.error.message) {
        result.message = envelope.error.message;
        result.globalErrors.push(envelope.error.message);
      }
      
      if (envelope.error.details) {
        result.fieldErrors = envelope.error.details;
      }
      
      return result;
    }

    // Handle DRF validation errors (field-based)
    const data = responseData as Record<string, unknown>;
    
    // Check for DRF non-field errors
    if ('detail' in data && typeof data.detail === 'string') {
      result.message = data.detail;
      result.globalErrors.push(data.detail);
    } else if ('non_field_errors' in data && Array.isArray(data.non_field_errors)) {
      result.globalErrors = data.non_field_errors.filter(
        (err): err is string => typeof err === 'string'
      );
      result.message = result.globalErrors[0] || 'Validation error';
    }

    // Parse field-level errors
    Object.entries(data).forEach(([field, value]) => {
      if (field === 'detail' || field === 'non_field_errors') {
        return;
      }
      
      if (Array.isArray(value)) {
        const stringErrors = value.filter((err): err is string => typeof err === 'string');
        if (stringErrors.length > 0) {
          result.fieldErrors[field] = stringErrors;
        }
      } else if (typeof value === 'string') {
        result.fieldErrors[field] = [value];
      }
    });

    // If we have field errors but no global message, create a summary
    if (Object.keys(result.fieldErrors).length > 0 && result.globalErrors.length === 0) {
      const fieldCount = Object.keys(result.fieldErrors).length;
      result.message = `Please fix ${fieldCount} field${fieldCount > 1 ? 's' : ''} below`;
      result.globalErrors.push(result.message);
    }
  }

  // Fallback for non-axios errors
  if (result.globalErrors.length === 0) {
    if (error instanceof Error) {
      result.message = error.message;
    } else if (typeof error === 'string') {
      result.message = error;
    }
    result.globalErrors.push(result.message);
  }

  return result;
}

/**
 * Helper to get the first error message for a specific field
 */
export function getFieldError(parsedError: ParsedError, fieldName: string): string | undefined {
  const errors = parsedError.fieldErrors[fieldName];
  return errors && errors.length > 0 ? errors[0] : undefined;
}

/**
 * Helper to check if there are any errors
 */
export function hasErrors(parsedError: ParsedError): boolean {
  return parsedError.globalErrors.length > 0 || Object.keys(parsedError.fieldErrors).length > 0;
}