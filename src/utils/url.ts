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

/**
 * Universal cookie parser supporting JSON, Netscape, Tabular DevTools, and Header formats
 */
export function parseCookies(input: string, defaultHost?: string): any[] {
  if (!input || typeof input !== 'string') return [];

  // Strip non-ASCII characters (e.g. checkmark icons ✓ from DevTools tables)
  const cleanInput = input.replace(/[^\x00-\x7F]/g, '');

  const cookies: any[] = [];
  const domainFallback = defaultHost ? `.${defaultHost.replace(/^www\./, '')}` : undefined;
  const trimmed = cleanInput.trim();

  // 1. JSON Array format
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => ({
            name: item.name || item.Name || '',
            value: item.value || item.Value || '',
            domain: item.domain || item.Domain || domainFallback,
            path: item.path || item.Path || '/',
            httpOnly: item.httpOnly ?? item.HttpOnly,
            secure: item.secure ?? item.Secure,
          }))
          .filter((c) => c.name && c.value);
      }
    } catch {}
  }

  // 2. Tabular / Netscape / Cookie Header format
  const lines = trimmed.split('\n');

  for (const line of lines) {
    const l = line.trim();
    if (!l || l.startsWith('#')) continue;

    // Tabular DevTools format
    if (l.includes('\t')) {
      const parts = l.split('\t').map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const value = parts[1];
        let domain = parts[2] || domainFallback;
        const path = parts[3] || '/';

        if (name && value && name !== 'Name') {
          cookies.push({
            name,
            value,
            domain: domain ? (domain.startsWith('.') ? domain : `.${domain.replace(/^www\./, '')}`) : domainFallback,
            path,
          });
        }
      }
      continue;
    }

    // Netscape format
    const spaceParts = l.split(/\s+/);
    if (spaceParts.length >= 7 && (spaceParts[0].startsWith('.') || spaceParts[0].includes('.'))) {
      const domain = spaceParts[0];
      const path = spaceParts[2];
      const name = spaceParts[5];
      const value = spaceParts[6];
      if (name && value) {
        cookies.push({
          name,
          value,
          domain: domain.startsWith('.') ? domain : `.${domain.replace(/^www\./, '')}`,
          path: path || '/',
        });
        continue;
      }
    }

    // Standard Header format: name1=val1; name2=val2
    const pairs = l.split(';');
    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const name = pair.substring(0, idx).trim();
        const value = pair.substring(idx + 1).trim();
        if (name && value) {
          cookies.push({
            name,
            value,
            domain: domainFallback,
            path: '/',
          });
        }
      }
    }
  }

  return cookies;
}
