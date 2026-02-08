# Story Adventure Tools

A minimalist framework for creating and playing through non-linear interactive stories. Everything runs client-side in your browser -- files never leave your computer.

If you like this, consider supporting further development!

<a href="https://www.buymeacoffee.com/Echsecutor" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Project Structure

- [`editor/`](./editor/) -- Web-based story creation tool (graph editor using Cytoscape.js)
- [`viewer/`](./viewer/) -- Web-based story player (Markdown rendering, save/load progress)
- [`commons/`](./commons/) -- Shared resources (Bootstrap UI, utilities, storage, notifications)
- [`stories/`](./stories/) -- Example stories and story collection

## Usage

### Deployed Version

- [Editor](https://echsecutor.github.io/story_adventure/editor)
- [Viewer](https://echsecutor.github.io/story_adventure/viewer)

### Local Development

No build step required. Serve the repository root with any static HTTP server:

```bash
python3 -m http.server
```

Then open `http://localhost:8000/editor/` or `http://localhost:8000/viewer/` in your browser.

## Story Format

Stories are JSON files. See the [example story](stories/example_story.json) for the format and the [stories README](./stories/README.md) for a list of available stories.

A story consists of:
- **Sections** -- Story content linked via choices in the `.next` array. Sections without choices are terminal.
- **State** -- Current game state including variables (for consistent naming, conditional logic, etc.)
- **Media** -- Images/videos per section, either linked or embedded as data URIs.

Choices may have a description (displayed as a clickable option) or be empty (acting as a simple "next" button for pagination).

## Acknowledgment

This project uses the following open source components:

- [Bootstrap 5](https://github.com/twbs/bootstrap) -- UI components
- [Cytoscape.js](https://github.com/cytoscape/cytoscape.js) -- Story graph visualization in the editor
  - [cytoscape-klay](https://github.com/cytoscape/cytoscape.js-klay) -- Graph layout
- [marked](https://github.com/markedjs/marked) -- Markdown rendering in the viewer
- [DOMPurify](https://github.com/cure53/DOMPurify) -- HTML sanitization in the viewer
- [JSZip](https://github.com/Stuk/jszip) -- Bundle export (zipping)
- [file-saver](https://github.com/eligrey/FileSaver.js/tree/master) -- Large file downloads from browser memory
- [esm.sh](https://github.com/esm-dev/esm.sh) -- ESM module conversion

See the respective project pages for licenses and meta-dependencies.

## License

Copyright 2024-2025 Sebastian Schmittner

<a href="https://www.gnu.org/licenses/agpl-3.0.html">
<img alt="AGPLV3" style="border-width:0" src="https://www.gnu.org/graphics/agplv3-with-text-162x68.png" /><br />
</a>

All code published in this repository is free software: it can be redistributed and/or modified under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. See [LICENSE](./LICENSE) for details.

For included open source dependencies, different licenses may apply. See the respective project pages listed above.
