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

/**
 * Calculates the unit price (e.g. per tablet, per ml) from a packSize string.
 * It looks for numbers in strings like "10 Tablets", "15ml", etc.
 */
export function calculateUnitPrice(price: number, packSize: string | null | undefined): { price: number, unit: string } | null {
  if (!price || !packSize) return null;
  
  const sizeMatch = packSize.match(/(\d+)\s*(tablet|cap|pill|ml|gm|g|kg|mg|patch)/i);
  if (sizeMatch && sizeMatch[1] && sizeMatch[2]) {
    const quantity = parseInt(sizeMatch[1], 10);
    if (quantity > 0) {
      // Return price per unit
      let unit = sizeMatch[2].toLowerCase();
      if (unit.startsWith('tab')) unit = 'tablet';
      if (unit.startsWith('cap')) unit = 'capsule';
      if (unit === 'g' || unit === 'gm') unit = 'gram';
      
      return {
        price: price / quantity,
        unit: unit
      };
    }
  }
  return null;
}
