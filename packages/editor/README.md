# @story-adventure/editor

Web-based visual editor for creating and editing interactive story adventures.

## Overview

The editor is a React application with a graph-based interface using React Flow. It provides:

- Visual graph editing of story structure
- Section and choice editing with rich text
- Action system UI for conditional logic
- Variable management
- Media handling (images, videos)
- Story export (JSON, bundle ZIP, linear markdown)

## Development

### Run in dev mode

```bash
pnpm dev
```

Opens at `http://localhost:5173`

### Build for production

```bash
pnpm build
```

Outputs to `dist/` directory.

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Type check
pnpm typecheck
```

## Bundle Generation

The editor can generate playable adventure bundles (ZIP files) that include the viewer and story files. To enable this feature:

1. Build the viewer bundle first:
   ```bash
   pnpm build:viewer-for-bundle
   ```
   This copies the viewer dist to `public/viewer-dist/` and generates a manifest file.

2. The bundle generation feature is available in the File menu:
   - "Save Adventure as it is" - Download story JSON
   - "Save Adventure with all images in one file" - Story JSON with embedded images
   - "Generate playable adventure bundle" - ZIP with viewer, story, and images
   - "Create Linear Story" - Generate linear markdown export

## Story Format

Stories are JSON files following the Story Adventure format. See the [Story Format documentation](../../.cursor/notes/story-format.md) for details.

## License

See root LICENSE file.
