export interface UserAgentPreset {
  userAgent: string;
  secChUa?: string;
  secChUaPlatform?: string;
}

const USER_AGENT_POOL: UserAgentPreset[] = [
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    secChUa: '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    secChUaPlatform: '"Windows"',
  },
  {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    secChUa: '"Not/A)Brand";v="8", "Chromium";v="125", "Google Chrome";v="125"',
    secChUaPlatform: '"macOS"',
  },
  {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    secChUa: '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    secChUaPlatform: '"Linux"',
  },
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
    secChUaPlatform: '"Windows"',
  },
  {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0',
    secChUaPlatform: '"macOS"',
  },
  {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    secChUaPlatform: '"macOS"',
  },
];

export function getRandomUserAgent(): UserAgentPreset {
  const index = Math.floor(Math.random() * USER_AGENT_POOL.length);
  return USER_AGENT_POOL[index];
}

export function getStealthHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const preset = getRandomUserAgent();

  const headers: Record<string, string> = {
    'User-Agent': preset.userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'Referer': 'https://www.google.com/',
  };

  if (preset.secChUa) {
    headers['sec-ch-ua'] = preset.secChUa;
  }
  if (preset.secChUaPlatform) {
    headers['sec-ch-ua-platform'] = preset.secChUaPlatform;
  }

  return { ...headers, ...customHeaders };
}
