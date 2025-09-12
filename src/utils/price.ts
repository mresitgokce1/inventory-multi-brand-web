/**
 * Safe price formatter that handles string, number, null, or undefined price values
 * Returns a formatted currency string using Turkish locale by default
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
    numericPrice = parseFloat(price);
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