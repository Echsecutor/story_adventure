# Story Adventure Tools

A minimalist framework for creating and playing through non-linear interactive stories. Everything runs client-side in your browser -- files never leave your computer.

If you like this, consider supporting further development!

<a href="https://www.buymeacoffee.com/Echsecutor" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Project Structure

This project is a pnpm monorepo with three packages:

- [`packages/shared/`](./packages/shared/) -- Shared TypeScript types, utilities, and action system
- [`packages/editor/`](./packages/editor/) -- Web-based story creation tool (React Flow graph editor)
- [`packages/viewer/`](./packages/viewer/) -- Web-based story player (Markdown rendering, save/load progress)
- [`stories/`](./stories/) -- Example stories and story collection
- [`scripts/`](./scripts/) -- Build scripts for bundle generation

## Technology Stack

- **React 19** + **TypeScript** -- Modern UI framework with type safety
- **React Flow** (`@xyflow/react`) -- Graph editor (replaces Cytoscape.js)
- **Vite** -- Fast build tool with HMR
- **pnpm workspaces** -- Monorepo dependency management
- **Vitest** + **Playwright** -- Comprehensive testing suite

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Run viewer in dev mode (http://localhost:5174)
pnpm --filter viewer dev

# Run editor in dev mode (http://localhost:5173)
pnpm --filter editor dev

# Run all packages in dev mode
pnpm dev
```

### Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Type check
pnpm typecheck

# Full verification (typecheck + test + test:e2e)
pnpm verify
```

### Building for Production

```bash
# Build all packages
pnpm build

# Download launcher binaries (tVeb web server for bundle launcher)
pnpm download:launcher-binaries

# Build viewer bundle for ZIP export (includes viewer + launcher)
pnpm build:viewer-for-bundle
```

**Note:** The editor's bundle generation feature requires the viewer bundle to be built first. Run `pnpm download:launcher-binaries` and `pnpm build:viewer-for-bundle` before generating playable adventure bundles. The generated bundles include a minimal self-contained web server, making them directly launchable on Windows and Linux without any additional software.

## Story Format

Stories are JSON files. See the [example story](stories/example_story.json) for the format and the [stories README](./stories/README.md) for a list of available stories.

A story consists of:
- **Sections** -- Story content linked via choices in the `.next` array. Sections without choices are terminal.
- **State** -- Current game state including variables (for consistent naming, conditional logic, etc.)
- **Media** -- Images/videos per section, either linked or embedded as data URIs.

Choices may have a description (displayed as a clickable option) or be empty (acting as a simple "next" button for pagination).

## Playable Bundles

The editor can export stories as standalone ZIP bundles that include:
- Pre-built viewer application
- Story JSON and media files
- Self-contained web server binaries (Windows + Linux)
- Launch scripts for easy startup

Users can run bundles by:
- **Linux/macOS:** Double-click `launcher/run_story_adventure.sh` or run from terminal
- **Windows:** Double-click `launcher/run_story_adventure.bat` or use PowerShell script

The launcher automatically starts the web server and opens the story in the default browser. No installation or configuration required.

**Web Server:** Bundles use [tVeb (Tiniest Veb Server)](https://github.com/davlgd/tVeb), a minimal (~1.5 MB) open-source static file server.

## Acknowledgment

This project uses the following open source components:

- [React](https://github.com/facebook/react) -- UI framework
- [React Flow](https://github.com/xyflow/xyflow) -- Graph editor (replaces Cytoscape.js)
- [Bootstrap 5](https://github.com/twbs/bootstrap) -- UI components
- [marked](https://github.com/markedjs/marked) -- Markdown rendering in the viewer
- [DOMPurify](https://github.com/cure53/DOMPurify) -- HTML sanitization in the viewer
- [JSZip](https://github.com/Stuk/jszip) -- Bundle export (zipping)
- [file-saver](https://github.com/eligrey/FileSaver.js/tree/master) -- Large file downloads from browser memory
- [Vite](https://github.com/vitejs/vite) -- Build tool
- [Vitest](https://github.com/vitest-dev/vitest) -- Test runner
- [Playwright](https://github.com/microsoft/playwright) -- E2E testing

See the respective project pages for licenses and meta-dependencies.

## License

Copyright 2024-2025 Sebastian Schmittner

<a href="https://www.gnu.org/licenses/agpl-3.0.html">
<img alt="AGPLV3" style="border-width:0" src="https://www.gnu.org/graphics/agplv3-with-text-162x68.png" /><br />
</a>

All code published in this repository is free software: it can be redistributed and/or modified under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. See [LICENSE](./LICENSE) for details.

For included open source dependencies, different licenses may apply. See the respective project pages listed above.
