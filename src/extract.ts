import {
  ExtractOptions,
  ExtractResult,
  Metadata,
  BatchExtractOptions,
  ExtractionMode,
} from './types.js';
import { normalizeUrl, randomDelay } from './utils/url.js';
import { fetchWithHttp } from './strategies/http.js';
import { fetchWithBrowser } from './strategies/browser.js';
import { extractWithHeuristics } from './parsers/heuristics.js';
import { parseWithReadability } from './parsers/readability.js';
import { extractMetadata } from './parsers/metadata.js';
import { convertToMarkdown } from './parsers/markdown.js';

function isBotChallengePage(html: string, title?: string): boolean {
  if (!html) return true;
  const lower = `${html} ${title || ''}`.toLowerCase();
  return (
    lower.includes('just a moment') ||
    lower.includes('attention required') ||
    lower.includes('security check') ||
    lower.includes('ddos protection') ||
    lower.includes('cf-browser-verification') ||
    lower.includes('checking your browser before accessing') ||
    lower.includes('enable javascript and cookies to continue') ||
    lower.includes('challenge-running') ||
    lower.includes('verify you are human') ||
    lower.includes('cloudflare')
  );
}

/**
 * Extracts clean text, markdown, HTML, and metadata from any website URL.
 *
 * @param targetUrl The web page URL to scrape.
 * @param options Optional configuration parameters.
 * @returns Promise<ExtractResult>
 *
 * @example
 * ```ts
 * import { extract } from 'extractly';
 *
 * const data = await extract('https://example.com');
 * console.log(data.text);
 * console.log(data.markdown);
 * console.log(data.metadata);
 * ```
 */
export async function extract(
  targetUrl: string,
  options: ExtractOptions = {}
): Promise<ExtractResult> {
  const startTime = Date.now();
  const url = normalizeUrl(targetUrl);
  const mode: ExtractionMode = options.mode || 'auto';

  // Apply optional random anti-rate-limit delay
  if (options.delay) {
    await randomDelay(options.delay.min, options.delay.max);
  }

  let htmlContent = '';
  let httpStatus = 200;
  let finalUrl = url;
  let strategyUsed: ExtractionMode | string = mode;

  // Execute extraction strategy
  if (mode === 'browser') {
    const res = await fetchWithBrowser(url, options);
    htmlContent = res.html;
    httpStatus = res.status;
    finalUrl = res.url;
    strategyUsed = 'browser';
  } else if (mode === 'fast' || mode === 'stealth') {
    const res = await fetchWithHttp(url, options);
    htmlContent = res.html;
    httpStatus = res.status;
    finalUrl = res.url;
    strategyUsed = mode;
  } else {
    // Mode: 'auto' (Cascading fallback: Fast HTTP -> Stealth HTTP -> Browser)
    try {
      const res = await fetchWithHttp(url, options);
      htmlContent = res.html;
      httpStatus = res.status;
      finalUrl = res.url;
      strategyUsed = 'fast-http';

      // Check if extracted content is sufficient or if hit by Cloudflare / Bot protection challenge
      const quickTestText = extractWithHeuristics(htmlContent, options.removeSelectors, options.customSelectors);
      const quickMeta = extractMetadata(htmlContent, finalUrl);
      const isChallenge = isBotChallengePage(htmlContent, quickMeta.title);

      if (!quickTestText || quickTestText.length < 50 || isChallenge) {
        // Attempt browser fallback if HTTP content returned sparse or blocked results
        try {
          const browserRes = await fetchWithBrowser(url, options);
          if (browserRes.html && (browserRes.html.length > htmlContent.length || isChallenge)) {
            htmlContent = browserRes.html;
            httpStatus = browserRes.status;
            finalUrl = browserRes.url;
            strategyUsed = 'browser-fallback';
          }
        } catch {
          // Ignore browser fallback failure and keep HTTP content
        }
      }
    } catch (err) {
      // If HTTP fails completely, attempt browser fallback
      try {
        const browserRes = await fetchWithBrowser(url, options);
        htmlContent = browserRes.html;
        httpStatus = browserRes.status;
        finalUrl = browserRes.url;
        strategyUsed = 'browser-fallback';
      } catch {
        throw err;
      }
    }
  }

  // Content Extraction
  const readabilityResult = parseWithReadability(htmlContent, finalUrl);
  const heuristicsText = extractWithHeuristics(
    htmlContent,
    options.removeSelectors,
    options.customSelectors
  );

  // Select best text content representation
  let title = readabilityResult?.title || '';
  let textContent = '';

  const rText = readabilityResult?.textContent || '';
  const hText = heuristicsText || '';

  // Choose the most comprehensive content text
  if (hText.length >= rText.length) {
    textContent = hText;
  } else {
    textContent = rText;
  }

  // Generate Markdown using the richer HTML source
  const rawHtmlForMarkdown = (htmlContent.length > (readabilityResult?.content?.length || 0) * 3)
    ? htmlContent
    : (readabilityResult?.content || htmlContent);
  const markdownContent = convertToMarkdown(rawHtmlForMarkdown);

  // Extract Metadata
  const metadata: Metadata = options.includeMetadata !== false
    ? extractMetadata(htmlContent, finalUrl)
    : {};

  if (!title && metadata.title) {
    title = metadata.title;
  }

  const wordCount = textContent ? textContent.trim().split(/\s+/).filter(Boolean).length : 0;
  const executionTimeMs = Date.now() - startTime;

  return {
    url: finalUrl,
    title: title || 'Untitled Page',
    text: textContent,
    markdown: markdownContent,
    html: htmlContent,
    metadata,
    stats: {
      contentLength: textContent.length,
      wordCount,
      executionTimeMs,
      strategyUsed,
      httpStatus,
    },
  };
}

/**
 * Batch extract content from multiple URLs concurrently with concurrency control.
 *
 * @param urls Array of URLs to scrape.
 * @param options Batch extraction options.
 * @returns Promise<ExtractResult[]>
 */
export async function extractMany(
  urls: string[],
  options: BatchExtractOptions = {}
): Promise<ExtractResult[]> {
  if (!Array.isArray(urls)) {
    throw new Error('urls parameter must be an array of URL strings');
  }

  const concurrency = Math.max(1, options.concurrency || 3);
  const results: ExtractResult[] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const chunk = urls.slice(i, i + concurrency);
    const chunkPromises = chunk.map((url) =>
      extract(url, options).catch((err) => ({
        url,
        title: 'Extraction Error',
        text: '',
        markdown: '',
        html: '',
        metadata: {},
        stats: {
          contentLength: 0,
          wordCount: 0,
          executionTimeMs: 0,
          strategyUsed: 'failed',
          httpStatus: 0,
        },
      }))
    );

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  return results;
}
