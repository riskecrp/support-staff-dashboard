/**
 * Levenshtein distance implementation for fuzzy name matching
 * Preserves the logic from PrepareMonthlyStats.gs
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  let i: number, j: number;
  
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // deletion
          matrix[i][j - 1] + 1,    // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Normalize name for matching
 * Preserves the logic from PrepareMonthlyStats.gs
 */
export function normalizeName(name: string | null | undefined): string {
  if (name === null || name === undefined) return '';
  let s = String(name);
  
  // Remove content enclosed by tildes ~...~
  s = s.replace(/~[^~]*~/g, ' ');
  
  // Remove parentheses/brackets content
  s = s.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');
  
  // Remove punctuation except letters, numbers and spaces
  s = s.replace(/[^a-zA-Z0-9\s]/g, ' ');
  
  // Collapse whitespace and lowercase
  s = s.replace(/\s+/g, ' ').trim().toLowerCase();
  
  return s;
}

/**
 * Find best matching name from a list using fuzzy logic
 */
export function findBestMatch(targetName: string, nameList: string[]): string | null {
  const normalized = normalizeName(targetName);
  
  // Try exact match first
  for (const name of nameList) {
    if (normalizeName(name) === normalized) {
      return name;
    }
  }
  
  // Fuzzy match with Levenshtein
  let bestMatch: string | null = null;
  let bestDist = Infinity;
  
  for (const name of nameList) {
    const dist = levenshteinDistance(normalizeName(name), normalized);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = name;
    }
  }
  
  // Accept if within threshold (20% of longer string length, capped at maximum 2)
  if (bestMatch !== null) {
    const lenMax = Math.max(bestMatch.length, targetName.length);
    const relThreshold = Math.ceil(lenMax * 0.20);
    const threshold = Math.min(2, relThreshold);
    
    return bestDist <= threshold ? bestMatch : null;
  }
  
  return null;
}
