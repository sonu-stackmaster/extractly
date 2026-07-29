import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ReadabilityResult {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
  lang: string;
}

export function parseWithReadability(html: string, url: string): ReadabilityResult | null {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document, {
      charThreshold: 50,
    });
    const article = reader.parse();

    if (!article || !article.textContent || article.textContent.trim().length < 50) {
      return null;
    }

    return {
      title: article.title || '',
      content: article.content || '',
      textContent: article.textContent.replace(/\s+/g, ' ').trim(),
      excerpt: article.excerpt || '',
      byline: article.byline || '',
      dir: article.dir || '',
      siteName: article.siteName || '',
      lang: article.lang || '',
    };
  } catch (err) {
    return null;
  }
}
