export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with space
    .replace(/\b(mg|ml|gm|mcg)\b/g, '') // Remove unit letters if separated
    .replace(/(\d+)(mg|ml|gm|mcg)\b/g, '$1') // Remove unit letters if attached to digits (500mg -> 500)
    .replace(/\b(tab|tabs|tablet|tablets|cap|caps|capsule|capsules|syr|syrup)\b/g, '') // Remove forms
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  
  if (norm1 === norm2) return 1.0;
  if (norm1.length === 0 || norm2.length === 0) return 0.0;
  
  const maxLength = Math.max(norm1.length, norm2.length);
  const distance = levenshteinDistance(norm1, norm2);
  
  return 1.0 - (distance / maxLength);
}
