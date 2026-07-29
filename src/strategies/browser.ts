import { ExtractOptions } from '../types.js';
import { getRandomUserAgent } from '../utils/user-agents.js';

export interface BrowserFetchResult {
  html: string;
  status: number;
  url: string;
}

/**
 * Chrome launch arguments ported and enhanced from high-performance anti-detection flags
 */
const STEALTH_CHROME_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-features=TranslateUI,BlinkGenPropertyTrees,VizDisplayCompositor',
  '--disable-ipc-flooding-protection',
  '--disable-extensions',
  '--disable-plugins',
  '--disable-web-security',
  '--disable-logging',
  '--disable-permissions-api',
  '--disable-notifications',
  '--disable-popup-blocking',
  '--disable-translate',
  '--disable-sync',
  '--disable-default-apps',
  '--disable-component-update',
  '--disable-background-downloads',
  '--disable-blink-features=AutomationControlled',
];

export async function fetchWithBrowser(
  url: string,
  options: ExtractOptions = {}
): Promise<BrowserFetchResult> {
  const timeoutMs = options.timeout ?? 20000;
  const uaPreset = getRandomUserAgent();

  try {
    // Dynamically attempt to load puppeteer-extra and stealth plugin
    const puppeteerExtra = (await import('puppeteer-extra')).default;
    const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;

    puppeteerExtra.use(StealthPlugin());

    const launchArgs = [...STEALTH_CHROME_ARGS, `--user-agent=${uaPreset.userAgent}`];
    if (options.proxy) {
      launchArgs.push(`--proxy-server=${options.proxy}`);
    }

    const browser = await puppeteerExtra.launch({
      headless: 'new' as any,
      args: launchArgs,
    });

    try {
      const page = await browser.newPage();

      await page.setViewport({ width: 1920, height: 1080 });
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'DNT': '1',
        ...options.headers,
      });

      page.setDefaultNavigationTimeout(timeoutMs);

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: timeoutMs,
      });

      const html = await page.content();
      const status = response ? response.status() : 200;
      const finalUrl = page.url();

      return {
        html,
        status,
        url: finalUrl,
      };
    } finally {
      await browser.close();
    }
  } catch (err: any) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find package') || err.message?.includes('Cannot find module')) {
      throw new Error(
        `Headless browser mode requested for "${url}", but "puppeteer-extra" is not installed. ` +
        `Please install puppeteer dependencies to enable browser mode: npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth`
      );
    }
    throw new Error(`Browser stealth strategy failed for "${url}": ${err.message}`);
  }
}
