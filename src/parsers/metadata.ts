import * as cheerio from 'cheerio';
import { Metadata } from '../types.js';

export function extractMetadata(html: string, pageUrl: string): Metadata {
  const metadata: Metadata = {};
  if (!html) return metadata;

  try {
    const $ = cheerio.load(html);

    // Document Title
    const documentTitle = $('title').first().text().trim();
    if (documentTitle) {
      metadata.title = documentTitle;
    }

    // OpenGraph Title
    const ogTitle = $('meta[property="og:title"]').attr('content') || $('meta[name="og:title"]').attr('content');
    if (ogTitle) {
      metadata.title = ogTitle.trim();
    }

    // Description
    const metaDesc =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content');
    if (metaDesc) {
      metadata.description = metaDesc.trim();
    }

    // Author
    const author =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('meta[name="twitter:creator"]').attr('content');
    if (author) {
      metadata.author = author.trim();
    }

    // Published & Modified Time
    const publishedTime =
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="publication_date"]').attr('content') ||
      $('meta[name="date"]').attr('content');
    if (publishedTime) {
      metadata.publishedTime = publishedTime.trim();
    }

    const modifiedTime = $('meta[property="article:modified_time"]').attr('content');
    if (modifiedTime) {
      metadata.modifiedTime = modifiedTime.trim();
    }

    // Image
    let image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('link[rel="image_src"]').attr('href');

    if (image) {
      metadata.image = resolveUrl(image.trim(), pageUrl);
    }

    // Favicon
    let favicon =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href');

    if (favicon) {
      metadata.favicon = resolveUrl(favicon.trim(), pageUrl);
    } else {
      try {
        const u = new URL(pageUrl);
        metadata.favicon = `${u.protocol}//${u.host}/favicon.ico`;
      } catch {
        // Ignore
      }
    }

    // Site Name
    const siteName = $('meta[property="og:site_name"]').attr('content');
    if (siteName) {
      metadata.siteName = siteName.trim();
    }

    // Language
    const lang = $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content');
    if (lang) {
      metadata.language = lang.trim();
    }

    // Canonical URL
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) {
      metadata.canonicalUrl = resolveUrl(canonical.trim(), pageUrl);
    }

    // Keywords
    const keywordsStr = $('meta[name="keywords"]').attr('content');
    if (keywordsStr) {
      metadata.keywords = keywordsStr
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }

    // Schema.org JSON-LD Parsing
    const jsonLdList: Record<string, any>[] = [];
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const jsonText = $(elem).html();
        if (jsonText) {
          const parsed = JSON.parse(jsonText.trim());
          if (Array.isArray(parsed)) {
            jsonLdList.push(...parsed);
          } else if (typeof parsed === 'object' && parsed !== null) {
            jsonLdList.push(parsed);
          }
        }
      } catch {
        // Ignore malformed JSON-LD
      }
    });

    if (jsonLdList.length > 0) {
      metadata.jsonLd = jsonLdList;
    }
  } catch {
    // Return partial metadata
  }

  return metadata;
}

function resolveUrl(relativeUrl: string, baseUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch {
    return relativeUrl;
  }
}
