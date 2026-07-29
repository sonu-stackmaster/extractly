# extractly ⚡

> **High-performance, resilient web scraping engine for Node.js.**  
> Effortlessly extract clean text, structured Markdown, HTML, and rich metadata from any website with anti-bot evasion and smart content parsing.

[![npm version](https://img.shields.io/npm/v/extractly.svg)](https://www.npmjs.com/package/extractly)
[![license](https://img.shields.io/npm/l/extractly.svg)](https://github.com/sonu-stackmaster/extractly/blob/main/LICENSE)

---

## Highlights

- **⚡ Simple One-Liner API**: Just provide a URL and get clean, structured content instantly.
- **🛡️ Anti-Bot & Stealth Evasion**: Built-in User-Agent rotation, realistic browser headers (`sec-ch-ua`), and custom network fingerprints to bypass common bot protection and rate limits.
- **🧠 Cascading Extraction Engine**: Combines **Mozilla Readability** with a **9-Tier Heuristic Extractor** to isolate main content from ads, navigations, footers, and sidebars.
- **📝 Multi-Format Output**: Instant conversion to **Clean Text**, **GitHub-Flavored Markdown** (ideal for LLM / AI prompts), and sanitized HTML.
- **🏷️ Rich Metadata Extraction**: Automatically parses OpenGraph, Twitter Cards, Schema.org JSON-LD, Canonical URLs, Favicons, Publication Dates, and Authors.
- **🚀 Zero Binary Overhead**: Runs on high-speed HTTP by default. Includes optional headless browser stealth fallback when client-side JavaScript rendering is required.
- **📦 TypeScript Native**: Written in 100% TypeScript with full type declarations, supporting both ESM and CommonJS.

---

## Installation

```bash
npm install extractly
```

---

## Quick Start

```javascript
import { extract } from 'extractly';
// Or CommonJS: const { extract } = require('extractly');

const result = await extract('https://example.com');

console.log(result.title);     // "Example Domain"
console.log(result.text);      // "This domain is for use in illustrative examples..."
console.log(result.markdown);  // Structured Markdown representation
```

---

## Advanced Usage

### Custom Extraction Options

```typescript
import { extract } from 'extractly';

const result = await extract('https://news.ycombinator.com', {
  mode: 'auto',              // 'auto' | 'fast' | 'stealth' | 'browser'
  output: 'markdown',        // Primary output format
  timeout: 15000,            // Execution timeout in ms
  includeMetadata: true,     // Extract OpenGraph / JSON-LD / Authors
  delay: { min: 1000, max: 2000 }, // Random anti-rate-limit delay
  customSelectors: ['.article-body'], // Target specific elements
  removeSelectors: ['.ads', '.popup'], // Strip unwanted noise
});

console.log('Title:', result.title);
console.log('Markdown:\n', result.markdown);
console.log('Metadata:', result.metadata);
console.log('Stats:', result.stats);
```

### Batch URL Extraction

Scrape multiple websites concurrently with built-in concurrency management:

```javascript
import { extractMany } from 'extractly';

const urls = [
  'https://example.com',
  'https://quotes.toscrape.com',
  'https://httpbin.org/html'
];

const results = await extractMany(urls, {
  concurrency: 3,
  timeout: 10000,
});

results.forEach((res) => {
  console.log(`[${res.title}] -> ${res.stats.wordCount} words extracted in ${res.stats.executionTimeMs}ms`);
});
```

---

## API Reference

### `extract(url, [options])`

Scrapes and extracts content from a single URL.

- **`url`** (`string`): Web page address to scrape.
- **`options`** (`ExtractOptions`, optional):
  - **`mode`**: `'auto'` (default), `'fast'`, `'stealth'`, or `'browser'`.
  - **`timeout`**: Maximum execution time in milliseconds (default: `15000`).
  - **`headers`**: Object containing custom HTTP headers.
  - **`proxy`**: Optional HTTP/HTTPS proxy string.
  - **`customSelectors`**: `string[]` of CSS selectors to extract content from explicitly.
  - **`removeSelectors`**: `string[]` of CSS selectors to strip out.
  - **`includeMetadata`**: `boolean` (default: `true`).
  - **`delay`**: `{ min: number, max: number }` random delay before requesting.
  - **`maxRetries`**: Number of retries on network failures (default: `2`).

### `ExtractResult`

```typescript
interface ExtractResult {
  url: string;
  title: string;
  text: string;
  markdown: string;
  html: string;
  metadata: {
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
  };
  stats: {
    contentLength: number;
    wordCount: number;
    executionTimeMs: number;
    strategyUsed: string;
    httpStatus?: number;
  };
}
```

---

## Headless Browser Mode (Optional)

`extractly` runs at maximum speed over HTTP without downloading any heavy browser binaries. If you need to scrape sites requiring client-side JavaScript execution or SPAs, you can install the optional peer dependencies:

```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

Then specify `mode: 'browser'` or rely on `mode: 'auto'` for smart fallback!

---

## License

[MIT](LICENSE) © sonu-stackmaster
