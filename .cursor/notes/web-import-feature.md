# Web Import Feature

## Overview

The editor includes an "Import From Web" feature (`File → Import From Web`) that allows users to convert web pages into linear stories. The feature is specifically optimized for civitai.com articles but can handle generic web content.

## Implementation

### Components

1. **`ImportFromWebModal`** (`packages/editor/src/components/dialogs/ImportFromWebModal.tsx`)
   - Modal dialog for URL input
   - Shows loading state during import
   - Displays error messages if import fails
   - Validates URL format (must start with http:// or https://)

2. **`webImporter`** (`packages/editor/src/utils/webImporter.ts`)
   - Core import logic module
   - CORS proxy handling
   - HTML parsing with DOMParser
   - Content extraction (civitai-specific and generic)
   - Story generation from extracted content

### CORS Proxy Strategy

Since browsers block cross-origin requests, the importer uses multiple CORS proxy services as fallbacks:
- `corsproxy.io` (primary)
- `allorigins.win` (fallback)
- `cors.eu.org` (fallback)

The importer tries each proxy in order until one succeeds.

### Content Extraction

#### Civitai.com Articles
For civitai.com URLs, the importer:
1. Finds the `<article>` tag
2. Processes child elements in order
3. Extracts text blocks from text elements (p, h1-h6, etc.)
4. Extracts images with their src URLs
5. Skips unwanted elements (buttons, nav, footer, scripts, etc.)

#### Generic Web Pages
For other URLs, the importer:
1. Finds main content area (main, article, [role="main"], .content, #content)
2. Extracts all paragraphs and headings
3. Extracts images (excluding icons and logos)
4. Creates content blocks from extracted elements

### Story Generation

The importer creates a linear story where:
- Each content block becomes a separate section
- Text blocks become section text
- Image blocks become section media
- Sections are connected with empty choices (auto-advance)
- Images use external URLs (not embedded)
- Story metadata includes source URL

## Usage Notes

- **Images are linked, not embedded**: Users should use "Save Adventure with all images in one file" after import to embed images
- **JavaScript-rendered content**: Only static HTML is fetched; pages that load content via JavaScript won't have that content available
- **Rate limits**: CORS proxy services may have rate limits
- **Best for static content**: Works best with article-style pages that have static HTML content

## Technical Limitations

1. **CORS restrictions**: Cannot directly fetch cross-origin content without proxy
2. **No JavaScript execution**: DOMParser doesn't execute scripts, so dynamically loaded content isn't available
3. **Proxy reliability**: Depends on third-party CORS proxy services
4. **Static HTML only**: Cannot interact with SPAs or JavaScript-heavy sites

## Future Enhancements

Potential improvements:
- Support for more site-specific extractors (Medium, Substack, etc.)
- Better handling of embedded media (videos, iframes)
- Image optimization/resizing during import
- Support for extracting story metadata from page headers
- Fallback to user's own CORS proxy if configured
