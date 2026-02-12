# Story Adventure Tools - Project Index

## Project Overview

Story Adventure Tools is a minimalist framework for creating and playing through non-linear interactive stories. The project consists of:

1. **Web-based tools** (Editor & Viewer) built with React + TypeScript
2. **Story format specification** and example stories
3. **Shared package** with core types and utilities

## Project Structure

This is a pnpm monorepo with three packages:

### Core Packages

- **`packages/shared/`** - Shared TypeScript types, utilities, and action system
  - `types.ts` - Story, Section, Choice, Action type definitions
  - `actions.ts` - Action execution engine (all 11 action types)
  - `utils.ts` - Utility functions (text extraction, file naming)
  - `variables.ts` - Variable interpolation logic
  - `storage.ts` - IndexedDB storage utilities
  - `aiPreferences.ts` - AI configuration management (localStorage)
  - `aiApiClient.ts` - LLM streaming client (OpenAI-compatible)
  - `aiImageGeneration.ts` - Image generation API client
  - `aiImageDescription.ts` - Vision API for prompt derivation
  - `aiPromptBuilder.ts` - Context building for AI story expansion
  - `aiValidator.ts` - AI response validation and merging

- **`packages/editor/`** - Web-based story creation tool
  - React Flow graph editor (replaces Cytoscape.js)
  - Story structure editing, media embedding, action system UI
  - AI story extension - generates new branches using LLM
  - AI image generation - creates images from prompts
  - AI prompt derivation - analyzes images to create prompts
  - Story metadata editor (starting section, characters, etc.)
  - Bundle generation (ZIP export with viewer + launcher)
  - `public/launcher/` - Self-contained launcher with tVeb binaries and scripts
  - Entry point: `src/main.tsx`, main component: `App.tsx`

- **`packages/viewer/`** - Web-based story player
  - Story playback with state management
  - Markdown rendering, media display, save/load progress
  - Complete story persistence to IndexedDB (auto-save/restore)
  - Keyboard hotkeys for navigation
  - Entry point: `src/main.tsx`, main component: `App.tsx`

### Other Directories

- **`stories/`** - Example stories and story collection
  - `example_story.json` - Main example demonstrating format
  - `test.json` - Action and variable testing story
  - Story-specific directories with JSON and image assets

- **`scripts/`** - Build scripts
  - `build-viewer-for-bundle.mjs` - Builds viewer and generates bundle manifest (includes launcher files)
  - `download-launcher-binaries.sh` - Downloads tVeb web server binaries for bundle launcher

### Story Format

Stories are JSON files with the following structure:

- **`meta`** - Story metadata (title, author, license)
- **`state`** - Current game state and variables
- **`sections`** - Story content sections with text, media, and choices
- **`variables`** - Initial variable definitions

### Key Technologies

- **Frontend**: React 19 + TypeScript + Vite
- **Graph Editor**: React Flow (`@xyflow/react`) with dagre layout
- **UI Framework**: Bootstrap 5 via `react-bootstrap`
- **Markdown**: marked.js for text rendering
- **File Handling**: JSZip, FileSaver.js for import/export
- **Security**: DOMPurify for HTML sanitization
- **Testing**: Vitest (unit tests) + Playwright (E2E tests)
- **Monorepo**: pnpm workspaces

## Project Documentation

- `Changelog.md` - Project changelog following Keep a Changelog format (root level)
- `README.md` - Root README with project overview and getting started
- `packages/*/README.md` - Package-specific documentation
- `stories/README.md` - Story collection documentation

## Related Notes Files

- **`architecture.md`** - Technical architecture, component relationships, data flow, and security considerations
- **`story-format.md`** - Complete JSON story format specification, action system, and variable management
- **`ai-features.md`** - AI story extension features, OpenAI API integration, LLM prompting strategies, and data model extensions
- **`ai-expansion-refactor-summary.md`** - Summary of the AI expansion system refactor: new response format, context optimization, improved validation
- **`development.md`** - Development workflow, coding standards, testing strategies, and contribution guidelines
- **`launcher-infrastructure.md`** - Self-contained launcher with tVeb web server, bundle structure, and implementation details
- **`toast-bug-analysis.md`** - Analysis of the infinite toast loop bug, root cause, fix, and test coverage gaps
- **`image-generation-models.md`** - Image generation model testing results, API parameters, SFW/NSFW capabilities, and model-specific configuration

## Key Features

- **Client-side only**: No server required, files never leave user's computer
- **Visual editing**: Graph-based story structure editing with React Flow
- **Rich content**: Support for images, videos, embedded media
- **Interactive elements**: Variable system, conditional logic, actions
- **AI story extension**: Optional LLM-powered dynamic story expansion (editor and viewer)
- **AI image generation**: Generate images from prompts using configured endpoints (editor and viewer)
- **AI prompt derivation**: Analyze existing images to create generation prompts (editor and viewer)
- **Export/Import**: JSON format with optional bundled media
- **Playable bundles**: Self-contained ZIP bundles with embedded web server (tVeb) and launch scripts for Windows/Linux
- **Type safety**: Full TypeScript coverage across codebase
- **Modern tooling**: Vite HMR, comprehensive test suite
