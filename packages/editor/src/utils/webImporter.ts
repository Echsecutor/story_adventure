/**
 * Web content importer for converting web pages into Story format.
 * Optimized for civitai.com articles but can handle generic content.
 */

import type { Story, Section } from '@story-adventure/shared';

/**
 * Result of web import operation
 */
export interface WebImportResult {
  success: boolean;
  story?: Story;
  error?: string;
}

/**
 * Configuration for CORS proxy services
 */
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors.eu.org/',
];

/**
 * Fetches HTML content from a URL using CORS proxy
 */
async function fetchWithProxy(url: string): Promise<string> {
  console.log('[WebImporter] Fetching URL:', url);
  
  // Try each proxy until one succeeds
  const errors: string[] = [];
  
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      console.log(`[WebImporter] Trying proxy: ${proxy}`);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        console.warn(`[WebImporter] Proxy ${proxy} returned HTTP ${response.status}`);
        errors.push(`${proxy}: HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();
      console.log(`[WebImporter] Received HTML length: ${html.length} characters`);
      
      if (html && html.length > 0) {
        return html;
      }
      
      errors.push(`${proxy}: Empty response`);
    } catch (error) {
      console.error(`[WebImporter] Proxy ${proxy} error:`, error);
      errors.push(`${proxy}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`All CORS proxies failed:\n${errors.join('\n')}`);
}

/**
 * Extracts text content from an element, removing script/style tags
 */
function extractTextContent(element: Element): string {
  const clone = element.cloneNode(true) as Element;
  
  // Remove unwanted elements (including images)
  const unwantedSelectors = ['script', 'style', 'button', 'nav', 'footer', 'aside', 'img'];
  unwantedSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  return clone.textContent?.trim() || '';
}

/**
 * Recursively walks through DOM tree extracting text and images in order
 */
function walkAndExtract(
  element: Element, 
  blocks: Array<{ type: 'text' | 'image', content: string }>,
  depth: number = 0
): void {
  // Skip unwanted elements entirely
  if (element.matches('button, nav, footer, aside, script, style, svg')) {
    return;
  }

  const tagName = element.tagName.toLowerCase();
  console.log(`${'  '.repeat(depth)}[WebImporter] Walking: <${tagName}>, id="${element.id}", class="${element.className}"`);

  // Check if this element is an image
  if (tagName === 'img') {
    const src = element.getAttribute('src') || element.getAttribute('data-src');
    if (src) {
      const absoluteSrc = src.startsWith('http') ? src : new URL(src, 'https://civitai.com').href;
      blocks.push({ type: 'image', content: absoluteSrc });
      console.log(`${'  '.repeat(depth)}[WebImporter] ✓ Added image: ${absoluteSrc.slice(0, 60)}...`);
    }
    return; // Don't process children of img
  }

  // Check if this is a text-containing block element (p, h1-h6, div with text)
  const blockElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (blockElements.includes(tagName)) {
    const text = extractTextContent(element);
    if (text && text.length > 10) {
      blocks.push({ type: 'text', content: text });
      console.log(`${'  '.repeat(depth)}[WebImporter] ✓ Added text (${text.length} chars): "${text.slice(0, 50)}..."`);
      return; // Don't recurse into text blocks we've already extracted
    }
  }

  // Recurse into children
  const children = Array.from(element.children);
  for (const child of children) {
    walkAndExtract(child, blocks, depth + 1);
  }
}

/**
 * Extracts content blocks (text and images) from civitai.com article
 */
function extractCivitaiContent(doc: Document): Array<{ type: 'text' | 'image', content: string }> {
  const blocks: Array<{ type: 'text' | 'image', content: string }> = [];
  
  console.log('[WebImporter] Extracting civitai content');
  
  // Find the article element
  const article = doc.querySelector('article');
  if (!article) {
    console.error('[WebImporter] No <article> element found');
    throw new Error('No <article> element found in the page');
  }

  console.log(`[WebImporter] Found article element with ${article.children.length} direct children`);
  console.log('[WebImporter] Walking DOM tree...');
  
  // Walk the entire article tree to extract content in order
  walkAndExtract(article, blocks);

  console.log(`[WebImporter] Extracted ${blocks.length} total blocks`);
  console.log(`[WebImporter] Block breakdown:`);
  const textBlocks = blocks.filter(b => b.type === 'text').length;
  const imageBlocks = blocks.filter(b => b.type === 'image').length;
  console.log(`[WebImporter]   - ${textBlocks} text blocks`);
  console.log(`[WebImporter]   - ${imageBlocks} image blocks`);
  
  return blocks;
}

/**
 * Extracts generic content from any web page
 * Falls back to this if civitai-specific extraction fails
 */
function extractGenericContent(doc: Document): Array<{ type: 'text' | 'image', content: string }> {
  const blocks: Array<{ type: 'text' | 'image', content: string }> = [];
  
  // Try to find main content area
  const mainContent = doc.querySelector('main, article, [role="main"], .content, #content');
  const root = mainContent || doc.body;

  if (!root) {
    throw new Error('Could not find content in the page');
  }

  // Extract paragraphs
  const paragraphs = root.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
  paragraphs.forEach(p => {
    const text = extractTextContent(p);
    if (text && text.length > 10) {
      blocks.push({ type: 'text', content: text });
    }
  });

  // Extract images
  const images = root.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src');
    if (src && !src.includes('icon') && !src.includes('logo')) {
      const absoluteSrc = src.startsWith('http') ? src : new URL(src, doc.location.href).href;
      blocks.push({ type: 'image', content: absoluteSrc });
    }
  });

  return blocks;
}

/**
 * Converts content blocks into a linear Story
 * Combines text+image pairs into single sections
 */
function blocksToStory(blocks: Array<{ type: 'text' | 'image', content: string }>, url: string): Story {
  console.log(`[WebImporter] Converting ${blocks.length} blocks to story`);
  
  const sections: Record<string, Section> = {};
  const sectionIds: string[] = [];
  let sectionCounter = 1;

  // Extract title from first text block or use URL
  const title = blocks.find(b => b.type === 'text')?.content.slice(0, 100) || url;
  console.log(`[WebImporter] Story title: ${title}`);

  // Group blocks into sections: try to pair text with following image
  let i = 0;
  while (i < blocks.length) {
    const sectionId = `section_${sectionCounter}`;
    const currentBlock = blocks[i];
    
    if (!currentBlock) {
      break; // Safety check
    }
    
    const nextBlock = i + 1 < blocks.length ? blocks[i + 1] : null;
    
    console.log(`[WebImporter] Creating section ${sectionId} starting at block ${i}`);
    
    const section: Section = {
      id: sectionId,
      text: '',
      next: [],
    };

    // If current block is text, add it
    if (currentBlock.type === 'text') {
      section.text = currentBlock.content;
      console.log(`[WebImporter]   Added text (${currentBlock.content.length} chars)`);
      
      // If next block is an image, add it to the same section
      if (nextBlock && nextBlock.type === 'image') {
        section.media = {
          type: 'image',
          src: nextBlock.content,
        };
        console.log(`[WebImporter]   Added image from next block`);
        i++; // Skip the image block since we consumed it
      }
      i++; // Move past the text block
    } 
    // If current block is an image (and not paired with text)
    else if (currentBlock.type === 'image') {
      section.media = {
        type: 'image',
        src: currentBlock.content,
      };
      console.log(`[WebImporter]   Added standalone image`);
      
      // If next block is text, add it to the same section
      if (nextBlock && nextBlock.type === 'text') {
        section.text = nextBlock.content;
        console.log(`[WebImporter]   Added text from next block (${nextBlock.content.length} chars)`);
        i++; // Skip the text block since we consumed it
      }
      i++; // Move past the image block
    }

    sections[sectionId] = section;
    sectionIds.push(sectionId);
    sectionCounter++;
  }

  console.log(`[WebImporter] Created ${sectionIds.length} sections`);

  // Now connect all sections with choices
  for (let j = 0; j < sectionIds.length - 1; j++) {
    const currentSectionId = sectionIds[j];
    const nextSectionId = sectionIds[j + 1];
    
    if (currentSectionId && nextSectionId && sections[currentSectionId]) {
      sections[currentSectionId].next = sections[currentSectionId].next || [];
      sections[currentSectionId].next!.push({
        text: '',
        next: nextSectionId,
      });
      
      console.log(`[WebImporter] Connected ${currentSectionId} -> ${nextSectionId}`);
    }
  }

  // Create the story
  const story: Story = {
    meta: {
      title,
      author: {
        name: 'Imported from web',
        url,
      },
      year: new Date().getFullYear().toString(),
    },
    state: {
      current_section: 'section_1',
      variables: {},
    },
    sections,
  };

  console.log(`[WebImporter] Story creation complete: ${sectionIds.length} sections, all connected linearly`);

  return story;
}

/**
 * Imports a web page and converts it to a Story
 */
export async function importFromWeb(url: string): Promise<WebImportResult> {
  console.log('[WebImporter] Starting import from:', url);
  
  try {
    // Validate URL
    if (!url || !url.startsWith('http')) {
      console.error('[WebImporter] Invalid URL:', url);
      return {
        success: false,
        error: 'Invalid URL. Please enter a valid HTTP or HTTPS URL.',
      };
    }

    // Fetch the HTML content
    const html = await fetchWithProxy(url);

    // Parse HTML
    console.log('[WebImporter] Parsing HTML with DOMParser');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    console.log('[WebImporter] Document parsed, title:', doc.title);
    console.log('[WebImporter] Body children count:', doc.body?.children.length);

    // Extract content blocks
    let blocks: Array<{ type: 'text' | 'image', content: string }>;
    
    // Try civitai-specific extraction first if it's a civitai URL
    if (url.includes('civitai.com')) {
      console.log('[WebImporter] Using civitai-specific extraction');
      try {
        blocks = extractCivitaiContent(doc);
      } catch (error) {
        console.warn('[WebImporter] Civitai extraction failed, falling back to generic extraction:', error);
        blocks = extractGenericContent(doc);
      }
    } else {
      console.log('[WebImporter] Using generic content extraction');
      blocks = extractGenericContent(doc);
    }

    // Validate we got some content
    if (blocks.length === 0) {
      console.error('[WebImporter] No content blocks extracted');
      return {
        success: false,
        error: 'No content found in the page. The page might be empty or require JavaScript to load.',
      };
    }

    console.log(`[WebImporter] Successfully extracted ${blocks.length} content blocks`);

    // Convert to story
    const story = blocksToStory(blocks, url);
    
    console.log('[WebImporter] Import successful, created story with', Object.keys(story.sections).length, 'sections');

    return {
      success: true,
      story,
    };
  } catch (error) {
    console.error('[WebImporter] Import failed:', error);
    return {
      success: false,
      error: `Failed to import from web: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
