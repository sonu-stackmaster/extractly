import { fetch, Agent } from 'undici';
import { ExtractOptions } from '../types.js';
import { getStealthHeaders } from '../utils/user-agents.js';

export interface HttpFetchResult {
  html: string;
  status: number;
  headers: Record<string, string>;
  url: string;
}

export async function fetchWithHttp(
  url: string,
  options: ExtractOptions = {}
): Promise<HttpFetchResult> {
  const timeoutMs = options.timeout ?? 15000;
  const maxRetries = options.maxRetries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const headers = getStealthHeaders(options.headers);

      if (options.cookies && options.cookies.length > 0) {
        const cookieStr = options.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
        headers['Cookie'] = cookieStr;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      // Configure undici dispatcher / agent if proxy is provided
      let dispatcher;
      if (options.proxy) {
        // Dynamic import for optional proxy agent if configured
        try {
          const { ProxyAgent } = await import('undici');
          dispatcher = new ProxyAgent(options.proxy);
        } catch {
          // Fallback without proxy if unavailable
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
        dispatcher,
        redirect: 'follow',
      });

      clearTimeout(timer);

      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        // Retry on 5xx server errors
        await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
        continue;
      }

      const html = await response.text();
      const resHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        resHeaders[key.toLowerCase()] = val;
      });

      return {
        html,
        status: response.status,
        headers: resHeaders,
        url: response.url || url,
      };
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch URL: ${url}`);
}
