/**
 * Zotero Translate - Extract metadata from web pages using Zotero translators
 */

import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

export interface ExtractMetadataOptions {
  /**
   * The URL of the page to extract metadata from
   */
  url: string;
  
  /**
   * Optional HTML content of the page. If not provided, it will be fetched from the URL
   */
  html?: string;
}

export interface ZoteroItem {
  itemType: string;
  title?: string;
  creators?: Array<{
    firstName?: string;
    lastName?: string;
    name?: string;
    creatorType?: string;
  }>;
  abstractNote?: string;
  publicationTitle?: string;
  date?: string;
  DOI?: string;
  url?: string;
  accessDate?: string;
  [key: string]: any;
}

/**
 * Extract metadata from a web page using Zotero translators
 * 
 * @param options - Options containing the URL and optional HTML content
 * @returns Promise resolving to an array of Zotero items
 * 
 * @example
 * ```typescript
 * const items = await extractMetadata({
 *   url: 'https://example.com/article'
 * });
 * 
 * // With custom HTML
 * const items = await extractMetadata({
 *   url: 'https://example.com/article',
 *   html: '<html>...</html>'
 * });
 * ```
 */
export async function extractMetadata(options: ExtractMetadataOptions): Promise<ZoteroItem[]> {
  const { url, html } = options;
  
  // Fetch HTML if not provided
  let htmlContent = html;
  if (!htmlContent) {
    const response = await fetch(url);
    htmlContent = await response.text();
  }
  
  // Parse HTML with JSDOM
  const dom = new JSDOM(htmlContent, { url });
  const document = dom.window.document;
  
  // Initialize Zotero environment
  const { initializeZotero } = await import('./zotero-runtime');
  const Zotero = await initializeZotero();
  
  // Set up translate instance
  const translate = new Zotero.Translate.Web();
  translate.setDocument(document);
  
  // Get translators for this page
  let translators;
  try {
    translators = await translate.getTranslators();
  } catch (e) {
    throw new Error(`Failed to get translators: ${e instanceof Error ? e.message : String(e)}`);
  }
  
  if (!translators || translators.length === 0) {
    return [];
  }
  
  // Collect items
  const items: ZoteroItem[] = [];
  
  // Set up handlers
  translate.setHandler('itemDone', (obj: any, item: ZoteroItem) => {
    items.push(item);
  });
  
  translate.setHandler('done', () => {
    // Translation complete
  });
  
  translate.setHandler('error', (error: Error) => {
    console.error('Translation error:', error);
  });
  
  // Perform translation
  await translate.translate();
  
  return items;
}
