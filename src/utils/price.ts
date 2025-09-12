/**
 * Safe price formatter that handles string, number, null, or undefined price values
 * Returns a formatted currency string using Turkish locale by default
 * Properly handles comma decimal separators in string inputs (e.g., "232,00")
 */
export function formatPrice(
  price: string | number | null | undefined | unknown,
  locale: string = 'tr-TR',
  currency?: string
): string {
  // Return placeholder for null/undefined
  if (price == null) {
    return '-';
  }

  // Convert string to number if needed
  let numericPrice: number;
  if (typeof price === 'string') {
    // Handle empty strings
    if (price.trim() === '') {
      return '-';
    }
    
    // Normalize string price - handle comma decimals and thousands separators
    // Remove thousands separators (dots in Turkish format like "1.000,50")
    // Then convert comma decimal to dot for parsing
    let normalizedPrice = price.trim();
    
    // Check if this looks like a Turkish format with comma decimal
    if (normalizedPrice.includes(',')) {
      // For strings like "1.000,50" or "232,00"
      // First remove thousands separators (dots before comma)
      const parts = normalizedPrice.split(',');
      if (parts.length === 2) {
        // Remove dots from integer part (thousands separators)
        const integerPart = parts[0].replace(/\./g, '');
        const decimalPart = parts[1];
        normalizedPrice = `${integerPart}.${decimalPart}`;
      }
    }
    
    numericPrice = parseFloat(normalizedPrice);
    // Return placeholder if string cannot be parsed as number
    if (isNaN(numericPrice)) {
      return '-';
    }
  } else if (typeof price === 'number') {
    numericPrice = price;
    // Return placeholder if number is NaN or infinite
    if (isNaN(numericPrice) || !isFinite(numericPrice)) {
      return '-';
    }
  } else {
    // Unexpected type, return placeholder
    return '-';
  }

  try {
    if (currency) {
      // Format with currency symbol
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(numericPrice);
    } else {
      // Format as decimal with $ prefix (keeping existing UI behavior)
      return `$${new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericPrice)}`;
    }
  } catch {
    // If Intl.NumberFormat fails, fallback to toFixed
    try {
      return `$${numericPrice.toFixed(2)}`;
    } catch {
      return '-';
    }
  }
}

/**
 * Normalizes price input for API submission
 * Converts comma decimals to dot decimals (e.g., "232,00" -> "232.00")
 */
export function normalizePriceForAPI(price: string): string {
  if (!price || typeof price !== 'string') {
    return price;
  }
  
  const trimmed = price.trim();
  if (trimmed === '') {
    return trimmed;
  }
  
  // Handle comma decimal format
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',');
    if (parts.length === 2) {
      // Remove dots from integer part (thousands separators)
      const integerPart = parts[0].replace(/\./g, '');
      const decimalPart = parts[1];
      return `${integerPart}.${decimalPart}`;
    }
  }
  
  return trimmed;
}