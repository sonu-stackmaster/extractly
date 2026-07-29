import * as cheerio from 'cheerio';

const DEFAULT_REMOVE_SELECTORS = [
  'script', 'style', 'nav', 'footer', 'iframe', 'noscript', 'header', 'aside',
  '.ads', '.ad', '.social-share', '.comments', '#comments', '.cookie-banner',
  '#fides-overlay', '#onetrust-consent-sdk', '#ot-sdk-cookie-policy',
  '[id*="consent"]', '[class*="cookie-banner"]', '[id*="fides"]'
];

const CONTENT_KEYWORDS = [
  'content', 'article', 'post', 'entry', 'body', 'text', 'main', 'primary',
  'story', 'news', 'blog', 'description', 'details', 'info', 'about',
  'menu', 'services', 'products', 'features', 'benefits', 'overview',
  'summary', 'intro', 'introductory', 'welcome', 'home', 'page'
];

/**
 * 9-tier comprehensive heuristic extraction engine
 */
export function extractWithHeuristics(
  html: string,
  removeSelectors: string[] = DEFAULT_REMOVE_SELECTORS,
  customSelectors?: string[]
): string | null {
  if (!html || typeof html !== 'string') return null;

  const $ = cheerio.load(html);

  // Remove noise elements
  const noiseSelectors = [...DEFAULT_REMOVE_SELECTORS, ...(removeSelectors || [])];
  noiseSelectors.forEach((sel) => {
    try {
      $(sel).remove();
    } catch {
      // Ignore invalid selector errors
    }
  });

  const contentParts: string[] = [];

  // Custom user selectors if provided
  if (customSelectors && customSelectors.length > 0) {
    for (const sel of customSelectors) {
      $(sel).each((_, elem) => {
        const txt = $(elem).text().trim();
        if (txt.length > 20) {
          contentParts.push(txt);
        }
      });
    }
  }

  // Strategy 1: Look for <article> tag
  $('article').each((_, elem) => {
    const text = $(elem).text().replace(/\s+/g, ' ').trim();
    if (text.length > 50) {
      contentParts.push(text);
    }
  });

  // Strategy 2: Look for <main> tag
  $('main').each((_, elem) => {
    const text = $(elem).text().replace(/\s+/g, ' ').trim();
    if (text.length > 50) {
      contentParts.push(text);
    }
  });

  // Strategy 3: Look for content divs with expanded class keywords
  $('div').each((_, elem) => {
    const className = $(elem).attr('class');
    const idName = $(elem).attr('id');
    const combined = `${className || ''} ${idName || ''}`.toLowerCase();

    if (CONTENT_KEYWORDS.some((kw) => combined.includes(kw))) {
      const text = $(elem).text().replace(/\s+/g, ' ').trim();
      if (text.length > 100) {
        contentParts.push(text);
      }
    }
  });

  // Strategy 4: Look for paragraphs <p>
  const paragraphTexts: string[] = [];
  $('p').each((_, elem) => {
    const text = $(elem).text().replace(/\s+/g, ' ').trim();
    if (text.length > 30) {
      paragraphTexts.push(text);
    }
  });
  if (paragraphTexts.length > 0) {
    contentParts.push(...paragraphTexts);
  }

  // Strategy 5: Headings and next sibling text
  $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
    const headingText = $(elem).text().replace(/\s+/g, ' ').trim();
    if (headingText.length > 10) {
      contentParts.push(headingText);

      const nextSibling = $(elem).next();
      if (nextSibling.length > 0) {
        const siblingText = nextSibling.text().replace(/\s+/g, ' ').trim();
        if (siblingText.length > 50) {
          contentParts.push(siblingText);
        }
      }
    }
  });

  // Strategy 6: Lists <ul>, <ol>
  $('ul, ol').each((_, elem) => {
    const listText = $(elem).text().replace(/\s+/g, ' ').trim();
    if (listText.length > 50) {
      contentParts.push(listText);
    }
  });

  // Strategy 7: <section> tags
  $('section').each((_, elem) => {
    const sectionText = $(elem).text().replace(/\s+/g, ' ').trim();
    if (sectionText.length > 100) {
      contentParts.push(sectionText);
    }
  });

  // Strategy 8: Substantial <div> elements
  $('div').each((_, elem) => {
    const divText = $(elem).text().replace(/\s+/g, ' ').trim();
    if (divText.length > 200) {
      contentParts.push(divText);
    }
  });

  // Strategy 9: Fallback to <body>
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  if (bodyText.length > 100) {
    contentParts.push(bodyText);
  }

  if (contentParts.length === 0) return null;

  // Deduplicate overlapping content
  const uniqueContent: string[] = [];
  for (const part of contentParts) {
    const cleanedPart = part.trim();
    if (cleanedPart.length > 20) {
      let isDuplicate = false;
      for (const existing of uniqueContent) {
        if (existing.includes(cleanedPart) || cleanedPart.includes(existing)) {
          isDuplicate = true;
          // Keep longer version if substring
          if (cleanedPart.length > existing.length) {
            const idx = uniqueContent.indexOf(existing);
            uniqueContent[idx] = cleanedPart;
          }
          break;
        }
      }
      if (!isDuplicate) {
        uniqueContent.push(cleanedPart);
      }
    }
  }

  const combinedText = uniqueContent.join(' ').replace(/\s+/g, ' ').trim();
  return combinedText.length > 50 ? combinedText : null;
}
