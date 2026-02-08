# @story-adventure/viewer

Web-based story player for interactive story adventures.

## Overview

The viewer is a React application that plays Story Adventure stories. It provides:

- Story playback with markdown rendering
- Choice-based navigation
- Save/load progress functionality
- Keyboard hotkeys for navigation
- Full-screen mode and background images
- Variable interpolation and action execution

## Development

### Run in dev mode

```bash
pnpm dev
```

Opens at `http://localhost:5174`

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

## Usage

### Loading Stories

Stories can be loaded via:

1. **File input**: Click "Load a Story Adventure" button and select a JSON file
2. **URL query parameter**: `?load=https://example.com/story.json`
3. **Local file**: `?load=../stories/example_story.json` (relative to viewer)

### Keyboard Shortcuts

- `b` / `←` - Go back to previous section
- `n` / `→` - Go to next section (if only one choice)
- `s` - Save progress
- `l` - Load progress
- `f` - Toggle full-screen
- `h` - Toggle text visibility
- `?` - Show help modal

## Story Format

Stories are JSON files following the Story Adventure format. See the [Story Format documentation](../../.cursor/notes/story-format.md) for details.

## License

See root LICENSE file.
