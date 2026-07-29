/**
 * Cleans and normalizes raw input URLs
 */
export function normalizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Invalid URL provided to extractly: URL must be a non-empty string');
  }

  let cleaned = rawUrl.trim();

  // Add protocol if missing
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    return parsed.toString();
  } catch (err) {
    throw new Error(`Invalid URL format: "${rawUrl}"`);
  }
}

/**
 * Checks if string is a valid HTTP/HTTPS URL
 */
export function isValidUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Utility delay function for anti-rate-limiting random waits
 */
export async function randomDelay(minMs: number = 500, maxMs: number = 2000): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
