/**
 * Format a date string to Europe/Berlin timezone
 * @param dateString ISO 8601 date string (UTC)
 * @returns Formatted date string (e.g., "2 Jan 2026 15:04")
 */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    timeZone: 'Europe/Berlin',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format entry fee from cents to EUR display
 * @param amountInCents Amount in cents
 * @param currency Currency code (e.g., "EUR")
 * @returns Formatted price string (e.g., "8.00 EUR")
 */
export function formatPrice(amountInCents: number, currency: string): string {
  const amount = amountInCents / 100;
  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * Get a readable label for rules enforcement level
 */
export function getRulesEnforcementLabel(level: string): string {
  const labels: Record<string, string> = {
    CASUAL: 'Casual',
    REGULAR: 'Regular',
    COMPETITIVE: 'Competitive',
    PROFESSIONAL: 'Professional',
  };
  return labels[level] || level;
}

/**
 * Format distance in meters to kilometers
 */
export function formatDistance(meters: number): string {
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}
