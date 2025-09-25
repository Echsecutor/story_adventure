# Story Adventure Tools - Project Index

## Project Overview

Story Adventure Tools is a minimalist framework for creating and playing through non-linear interactive stories. The project consists of:

1. **Web-based tools** (Editor & Viewer) running pure client-side JavaScript
2. **Story format specification** and example stories
3. **Shared components** and utilities

## Project Structure

### Core Components

- **`/editor/`** - Web-based story creation tool
  - Graph-based visual editor using Cytoscape.js
  - Story structure editing, media embedding, action system
  - Entry point: `index.html`, main logic: `code.js`
- **`/viewer/`** - Web-based story player

  - Story playback with state management
  - Markdown rendering, media display, save/load progress
  - Entry point: `index.html`, main logic: `code.js`

- **`/commons/`** - Shared resources and utilities

  - `common.js` - Core action system and story logic
  - `utils.js` - Utility functions
  - `storage.js` - Local storage management
  - `toast.js` - Notification system
  - Bootstrap CSS/JS and other vendor libraries

- **`/stories/`** - Example stories and story collection
  - `example_story.json` - Main example demonstrating format
  - `test.json` - Action and variable testing story
  - Story-specific directories with JSON and image assets

### Story Format

Stories are JSON files with the following structure:

- **`meta`** - Story metadata (title, author, license)
- **`state`** - Current game state and variables
- **`sections`** - Story content sections with text, media, and choices
- **`variables`** - Initial variable definitions

### Key Technologies

- **Frontend**: Pure JavaScript (ES6 modules), Bootstrap 5 UI
- **Graph Visualization**: Cytoscape.js with Klay layout
- **Markdown**: marked.js for text rendering
- **File Handling**: JSZip, FileSaver.js for import/export
- **Security**: DOMPurify for HTML sanitization

## Related Notes Files

- **`architecture.md`** - Technical architecture, component relationships, data flow, and security considerations
- **`story-format.md`** - Complete JSON story format specification, action system, and variable management
- **`development.md`** - Development workflow, coding standards, testing strategies, and contribution guidelines

## Key Features

- **Client-side only**: No server required, files never leave user's computer
- **Visual editing**: Graph-based story structure editing
- **Rich content**: Support for images, videos, embedded media
- **Interactive elements**: Variable system, conditional logic, actions
- **Export/Import**: JSON format with optional bundled media
