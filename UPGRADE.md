# Upgrade Guide

This guide helps users migrate from the old vendored JavaScript version to the new React + TypeScript monorepo.

## Overview of Changes

The Story Adventure Tools have been completely refactored from vanilla JavaScript to a modern React + TypeScript + Vite monorepo. The story format remains **100% compatible** - all existing story JSON files will work without modification.

## What Changed

### Technology Stack

- **Old**: Vanilla JavaScript (ES6 modules), Cytoscape.js, vendored dependencies
- **New**: React 19 + TypeScript, React Flow, npm packages, pnpm monorepo

### Project Structure

- **Old**: `editor/`, `viewer/`, `commons/` directories with vendored files
- **New**: `packages/shared/`, `packages/editor/`, `packages/viewer/` monorepo structure

### Build Process

- **Old**: No build step - served directly from static files
- **New**: Vite-based build system with HMR for development

## Story Format Compatibility

✅ **No changes required** - All existing story JSON files are fully compatible.

The story format specification has not changed:
- Story structure (meta, state, sections, variables)
- Action system (all 11 action types work identically)
- Variable interpolation syntax (`${variable}`)
- Media handling (images, videos, data URLs)

## For End Users

### Using the Viewer

**Old way**:
- Open `viewer/index.html` in browser or serve via HTTP server

**New way**:
- Development: `pnpm --filter viewer dev` → opens at `http://localhost:5174`
- Production: Build with `pnpm --filter viewer build`, serve `packages/viewer/dist/`

### Using the Editor

**Old way**:
- Open `editor/index.html` in browser or serve via HTTP server

**New way**:
- Development: `pnpm --filter editor dev` → opens at `http://localhost:5173`
- Production: Build with `pnpm --filter editor build`, serve `packages/editor/dist/`

### Loading Stories

Story loading works the same way:
- File input: Click "Load a Story Adventure" button
- URL query parameter: `?load=https://example.com/story.json`
- Local file: `?load=../stories/example_story.json`

## For Developers

### Development Setup

**Prerequisites**:
- Node.js >= 18.0.0
- pnpm >= 9.0.0

**Installation**:
```bash
pnpm install
```

**Development**:
```bash
# Run viewer
pnpm --filter viewer dev

# Run editor
pnpm --filter editor dev

# Run all packages
pnpm dev
```

### Testing

**Old**: Manual testing in browser

**New**: Comprehensive test suite
```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Type check
pnpm typecheck

# Full verification
pnpm verify
```

### Code Changes

If you were contributing to the old codebase:

1. **Language**: JavaScript → TypeScript
2. **Framework**: Vanilla JS → React 19
3. **Graph Library**: Cytoscape.js → React Flow
4. **Build Tool**: None → Vite
5. **Package Manager**: None → pnpm workspaces

### API Changes

The public APIs remain the same:
- Action system: Same action types and parameters
- Story format: Identical JSON structure
- Storage: Same IndexedDB schema

## Breaking Changes

### None for Story Files

Story JSON files are fully compatible. No migration needed.

### For Developers Only

If you were importing from the old `commons/` files:

**Old**:
```javascript
import { execute_actions } from '../commons/common.js';
```

**New**:
```typescript
import { execute_actions } from '@story-adventure/shared';
```

## New Features

### Developer Experience

- **TypeScript**: Full type safety across codebase
- **Hot Module Replacement**: Instant updates during development
- **Comprehensive Tests**: Unit tests (Vitest) + E2E tests (Playwright)
- **Better Documentation**: Package-level READMEs and improved docs

### User Experience

- **Improved Graph Editor**: React Flow provides better editing experience
- **Better Performance**: Vite optimizations and code splitting
- **Same Functionality**: All features from old version preserved

## Migration Steps

### For End Users

1. **No action required** - Story files work as-is
2. If hosting yourself: Follow new build instructions in README.md

### For Developers

1. Install Node.js >= 18 and pnpm >= 9
2. Clone repository
3. Run `pnpm install`
4. Run `pnpm dev` to start development servers
5. Update any custom scripts to use new package structure

## Troubleshooting

### "Cannot find module"

- Ensure you've run `pnpm install`
- Check that you're using the correct import paths (`@story-adventure/shared`)

### "Type errors"

- Run `pnpm typecheck` to see all TypeScript errors
- Ensure story JSON files match the TypeScript types (they should if they worked before)

### "Graph not rendering"

- Ensure React Flow dependencies are installed: `pnpm --filter editor install`
- Check browser console for errors

## Support

If you encounter issues during migration:

1. Check this guide
2. Review README.md for setup instructions
3. Check Changelog.md for detailed changes
4. Open an issue on GitHub

## Rollback

If you need to use the old version:

- Check out an older git commit before the refactoring
- The old version is still available in git history
