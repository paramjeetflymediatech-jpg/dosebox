/**
 * Formats a number to the Indian Numbering System (en-IN).
 * It will display up to 2 decimal places if they exist, but will drop `.00` for whole numbers.
 */
export function formatCurrency(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '0';
  
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(numericAmount);
}
