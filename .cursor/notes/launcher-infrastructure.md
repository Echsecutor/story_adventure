# Launcher Infrastructure

## Overview

The launcher infrastructure makes story bundles self-contained and directly launchable on Windows and Linux without requiring users to install any additional software.

## Components

### Web Server: tVeb

- **Name**: Tiniest Veb Server (tVeb)
- **Version**: v0.2.0
- **Source**: https://github.com/davlgd/tVeb
- **License**: Open source (V language project)
- **Size**: ~1.2 MB (Linux), ~1.4 MB (Windows)
- **Technology**: Written in V language using the veb web framework

**Why tVeb?**
- Minimal size (<1.5 MB per binary)
- Single self-contained binary with no dependencies
- Cross-platform (Windows, Linux, macOS)
- Fast static file serving
- Simple command-line interface
- No configuration files required

**Alternatives Considered**:
- Static Web Server (SWS): 4 MB, more features but larger
- Caddy: Feature-rich but too heavy for simple static serving
- Python's http.server: Requires Python installation
- Node.js serve: Requires Node.js installation

### Launch Scripts

**Linux/macOS**: `run_story_adventure.sh`
- Bash script
- Auto-detects browser (xdg-open, gnome-open, open)
- Makes binaries executable
- Supports custom port via argument

**Windows**: Two options
1. `run_story_adventure.bat` - Batch script (recommended for most users)
2. `run_story_adventure.ps1` - PowerShell script (more advanced features)

Both Windows scripts:
- Use `start` command to open browser
- Support custom port via argument
- Handle path spaces correctly

### Documentation

`launcher/README.md` provides:
- Quick start instructions
- Platform-specific usage
- Custom port configuration
- Troubleshooting (permission issues, SmartScreen, port conflicts)
- Manual server usage

## Implementation

### File Structure

```
packages/editor/public/launcher/
├── .gitignore              # Ignore binaries in git
├── README.md               # User documentation
├── run_story_adventure.sh  # Linux/macOS launcher
├── run_story_adventure.bat # Windows batch launcher
├── run_story_adventure.ps1 # Windows PowerShell launcher
├── tVeb-linux-x86_64      # Linux binary (~1.2 MB) [gitignored]
└── tVeb-windows-x86_64.exe # Windows binary (~1.4 MB) [gitignored]
```

### Build Process

**Downloading Binaries**:
```bash
pnpm download:launcher-binaries
# or directly:
bash scripts/download-launcher-binaries.sh
```

**Building Bundle Manifest**:
```bash
pnpm build:viewer-for-bundle
```

This runs `scripts/build-viewer-for-bundle.mjs` which:
1. Builds viewer package
2. Copies viewer dist to editor public
3. Reads launcher directory recursively
4. Stores text files as strings in manifest
5. Stores binary files as base64 objects in manifest
6. Generates `packages/editor/src/viewer-bundle-manifest.json`

**Creating Bundles**:

When user exports a bundle in the editor, `packages/editor/src/utils/bundle.ts`:
1. Creates ZIP structure
2. Adds viewer files to `viewer/` folder
3. Adds launcher files to `launcher/` folder
   - Decodes base64 binaries back to binary format
   - Adds text files (scripts, README) as-is
4. Adds story JSON and media to `stories/<story-name>/`
5. Adds root `index.html` redirect

### Binary Handling

**Storage**: Binaries stored as base64 in manifest
```typescript
interface ViewerBundleManifest {
  files: Record<string, string | { base64: string }>;
}
```

**Detection**: Files matching `tVeb-*` or `*.exe` treated as binary

**Encoding**: `readFileSync(fullPath).toString('base64')`

**Decoding**: `zip.file(path, content.base64, { base64: true })`

## Bundle Structure

Exported ZIP bundles contain (launcher files at top level for easy access):

```
story-name.zip
├── README.md                     # Launcher usage documentation
├── index.html                    # Root redirect to viewer
├── run_story_adventure.sh        # Linux/macOS launcher
├── run_story_adventure.bat       # Windows batch launcher
├── run_story_adventure.ps1       # Windows PowerShell launcher
├── tVeb-linux-x86_64            # Linux web server binary
├── tVeb-windows-x86_64.exe      # Windows web server binary
├── viewer/                       # Pre-built viewer
│   ├── index.html
│   └── assets/
│       ├── index-[hash].js
│       └── index-[hash].css
└── stories/
    └── story-name/
        ├── story-name.json
        ├── section1.png
        └── section2.jpg
```

## Usage Workflow

1. User exports bundle in editor
2. User extracts ZIP
3. User sees launcher files immediately in the top-level directory
4. User runs launcher script:
   - Linux/macOS: `./run_story_adventure.sh` (double-click or terminal)
   - Windows: Double-click `run_story_adventure.bat`
5. Script starts web server on port 8080 from bundle root directory
6. Script opens browser to `http://localhost:8080`
7. Root `index.html` redirects to viewer with story auto-loaded
8. User enjoys story, press Ctrl+C to stop server

## Development Notes

**Testing**:
- Test bundle creation in editor
- Extract ZIP and verify file structure
- Test launcher on each platform
- Verify web server serves files correctly
- Check browser auto-opens to correct URL

**Updating tVeb**:
1. Update version in `scripts/download-launcher-binaries.sh`
2. Run `pnpm download:launcher-binaries`
3. Run `pnpm build:viewer-for-bundle`
4. Test bundle creation and launching

**Git Workflow**:
- Binaries are gitignored via `packages/editor/public/launcher/.gitignore`
- Contributors must run `pnpm download:launcher-binaries` after cloning
- CI/CD should download binaries as part of build process

## Web Search Results

Search: "minimal self-contained static file webserver single binary Windows Linux 2026"

**Top Results** (Feb 8, 2026):
1. Static Web Server (SWS) - 4 MB Rust binary, production-ready
2. tVeb - <1 MB V language binary, minimal and simple ✓ Selected
3. Caddy - Feature-rich but heavier

**Selection Rationale**:
- Size: tVeb is smallest option
- Simplicity: Single binary, no config
- Platform support: Windows + Linux covered
- License: Open source
- Community: Active development
