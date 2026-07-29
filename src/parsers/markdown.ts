import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';

export function convertToMarkdown(html: string): string {
  if (!html || typeof html !== 'string') return '';

  try {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '_',
      strongDelimiter: '**',
      bulletListMarker: '-',
    });

    // Use GitHub Flavored Markdown (tables, task lists, strikethrough)
    turndownService.use(gfm);

    // Remove unwanted script/style noise if present
    turndownService.remove(['script', 'style', 'noscript', 'iframe']);

    const markdown = turndownService.turndown(html);
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
  } catch (err) {
    // Fallback if turndown fails
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
