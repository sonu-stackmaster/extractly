export type ExtractionMode = 'auto' | 'fast' | 'stealth' | 'browser';
export type OutputFormat = 'text' | 'markdown' | 'html' | 'json';

export interface DelayOptions {
  min: number;
  max: number;
}

export interface ExtractOptions {
  /**
   * Extraction strategy mode:
   * - 'auto': Smart automatic fallback (HTTP fast -> HTTP stealth -> Headless browser if needed)
   * - 'fast': Ultra-fast HTTP request using cheerio & readability
   * - 'stealth': Anti-detection HTTP request with header/UA rotation
   * - 'browser': Headless browser execution for rendering JavaScript / SPA sites
   * @default 'auto'
   */
  mode?: ExtractionMode;

  /**
   * Primary output format desired
   * @default 'text'
   */
  output?: OutputFormat;

  /**
   * Maximum execution timeout in milliseconds
   * @default 15000
   */
  timeout?: number;

  /**
   * Custom HTTP headers to include with the request
   */
  headers?: Record<string, string>;

  /**
   * Optional proxy URL (e.g. 'http://username:password@proxy.example.com:8080')
   */
  proxy?: string;

  /**
   * Custom CSS selectors to extract content from explicitly
   */
  customSelectors?: string[];

  /**
   * CSS selectors to decompose / remove before extracting text
   * @default ['script', 'style', 'nav', 'footer', 'iframe', 'noscript', 'header', 'aside']
   */
  removeSelectors?: string[];

  /**
   * Whether to extract metadata (OpenGraph, Twitter Cards, Schema.org JSON-LD, Favicon, Author)
   * @default true
   */
  includeMetadata?: boolean;

  /**
   * Delay range before making requests to avoid rate limiting
   */
  delay?: DelayOptions;

  /**
   * Maximum retries on transient errors (429, 5xx, socket timeouts)
   * @default 2
   */
  maxRetries?: number;
}

export interface Metadata {
  title?: string;
  description?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
  favicon?: string;
  language?: string;
  canonicalUrl?: string;
  siteName?: string;
  keywords?: string[];
  jsonLd?: Record<string, any>[];
}

export interface ExtractStats {
  contentLength: number;
  wordCount: number;
  executionTimeMs: number;
  strategyUsed: ExtractionMode | string;
  httpStatus?: number;
}

export interface ExtractResult {
  /** Target web page URL */
  url: string;

  /** Page title */
  title: string;

  /** Main extracted plain text content */
  text: string;

  /** Formatted markdown content representation */
  markdown: string;

  /** Cleaned HTML content */
  html: string;

  /** Page metadata (Open Graph, Twitter, JSON-LD, etc.) */
  metadata: Metadata;

  /** Extraction performance statistics and execution metrics */
  stats: ExtractStats;
}

export interface BatchExtractOptions extends ExtractOptions {
  /** Max concurrent extractions for batch operations @default 3 */
  concurrency?: number;
}
