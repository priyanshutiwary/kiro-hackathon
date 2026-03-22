/**
 * Utility functions for Nango integrations
 * Common helpers used across different provider actions
 */

/**
 * Build a query string from an object
 * Useful for constructing API URLs with parameters
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  
  return filtered.length > 0 ? `?${filtered.join('&')}` : '';
}

/**
 * Paginate through API results
 * Generic helper for handling paginated API responses
 */
export async function paginateResults<T>(
  fetchPage: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  maxPages: number = 100
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore && page <= maxPages) {
    const response = await fetchPage(page);
    results.push(...response.data);
    hasMore = response.hasMore;
    page++;
  }
  
  return results;
}

/**
 * Retry a function with exponential backoff
 * Useful for handling transient API errors
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Format date to ISO string for API requests
 */
export function formatDateForApi(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return undefined;
  }
}

/**
 * Chunk an array into smaller arrays
 * Useful for batch processing
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
