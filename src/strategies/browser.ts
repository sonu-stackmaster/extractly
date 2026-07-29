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
    const puppeteerExtraMod = await import('puppeteer-extra');
    const puppeteerExtra = puppeteerExtraMod.default || puppeteerExtraMod;
    const stealthMod = await import('puppeteer-extra-plugin-stealth');
    const StealthPlugin = stealthMod.default || stealthMod;

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

      let response;
      try {
        response = await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: timeoutMs,
        });
      } catch {
        // Fallback if networkidle2 times out
        response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: timeoutMs,
        });
      }

      // Allow 1.5 seconds for client-side JS/React/Vue frameworks to finish rendering DOM
      await new Promise((res) => setTimeout(res, 1500));

      // Remove cookie consent banners / overlays in page before grabbing HTML
      await page.evaluate(() => {
        try {
          const selectors = [
            '#fides-overlay', '#onetrust-consent-sdk', '.cookie-banner',
            '[id*="consent"]', '[class*="cookie-banner"]', '[id*="fides"]'
          ];
          selectors.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => el.remove());
          });
        } catch {}
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
