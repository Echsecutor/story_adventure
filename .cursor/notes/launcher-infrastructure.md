# Launcher Infrastructure

## Overview

The launcher infrastructure makes story bundles self-contained and directly launchable on Windows and Linux without requiring users to install any additional software.

## Components

### Web Server: miniserve

- **Name**: miniserve
- **Version**: v0.32.0
- **Source**: https://github.com/svenstaro/miniserve
- **License**: MIT
- **Size**: ~7-8 MB per binary
- **Technology**: Written in Rust using Actix web framework
- **Stars**: 7,300+ on GitHub
- **Status**: Actively maintained (last release September 2024)

**Why miniserve?**
- Production-ready and actively maintained
- Proper MIME type handling out of the box
- Single self-contained binary with no dependencies
- Cross-platform (Windows, Linux, macOS)
- Fast and secure (Rust guarantees)
- Feature-rich: SPA support, auth, TLS, QR codes
- Large, active community

**Alternatives Considered**:
- tVeb: Too small/minimal, v0.2.0 abandoned project, MIME type issues ❌
- Static Web Server (SWS): 4 MB, good alternative but less popular
- Caddy: Feature-rich but too heavy for simple static serving
- Python's http.server: Requires Python installation
- Node.js serve: Requires Node.js installation

### Launch Scripts

**Linux/macOS**: `run_story_adventure.sh`
- Bash script
- Auto-detects browser (xdg-open, gnome-open, open)
- Makes binaries executable
- Supports custom port via argument
- Uses miniserve with `--port` and `--index` flags

**Windows**: Two options
1. `run_story_adventure.bat` - Batch script (recommended for most users)
2. `run_story_adventure.ps1` - PowerShell script (more advanced features)

Both Windows scripts:
- Use `start` command to open browser
- Support custom port via argument
- Handle path spaces correctly
- Uses miniserve with `--port` and `--index` flags

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

**Detection**: Files matching `miniserve-*` or `*.exe` treated as binary

**Encoding**: `readFileSync(fullPath).toString('base64')`

**Decoding**: `zip.file(path, content.base64, { base64: true })`

## Bundle Structure

Exported ZIP bundles contain (launcher files at top level for easy access):

```
story-name.zip
├── README.md                     # Launcher usage documentation
├── run_story_adventure.sh        # Linux/macOS launcher
├── run_story_adventure.bat       # Windows batch launcher
├── run_story_adventure.ps1       # Windows PowerShell launcher
├── miniserve-linux              # Linux web server binary (~7-8 MB)
├── miniserve-win.exe            # Windows web server binary (~7-8 MB)
└── web/                          # Web content directory (served by miniserve)
    ├── index.html                # Entry point that redirects to viewer with story
    ├── viewer/                   # Pre-built viewer
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

**Important Path Resolution**: All paths in the bundle use absolute paths from the web root (e.g., `/stories/...`) rather than relative paths (e.g., `./stories/...`) to ensure correct resolution when the viewer is at `/viewer/`.

**Important**: The `web/` subdirectory separates web content from launcher scripts, preventing tVeb from encountering files with unknown MIME types (`.bat`, `.ps1`) which would cause a panic.

## Usage Workflow

1. User exports bundle in editor
2. User extracts ZIP
3. User sees launcher files immediately in the top-level directory
4. User runs launcher script:
   - Linux/macOS: `./run_story_adventure.sh` (double-click or terminal)
   - Windows: Double-click `run_story_adventure.bat`
5. Script starts web server on port 8080 serving from `web/` subdirectory
6. Script opens browser to `http://localhost:8080`
7. `web/index.html` redirects to viewer with story auto-loaded
8. User enjoys story, press Ctrl+C to stop server

## Development Notes

**Testing**:
- Test bundle creation in editor
- Extract ZIP and verify file structure
- Test launcher on each platform
- Verify web server serves files correctly
- Check browser auto-opens to correct URL

**Updating miniserve**:
1. Update version in `scripts/download-launcher-binaries.sh`
2. Run `pnpm download:launcher-binaries`
3. Run `pnpm build:viewer-for-bundle`
4. Test bundle creation and launching

**Git Workflow**:
- Binaries are gitignored via `packages/editor/public/launcher/.gitignore` (ignores `miniserve-*` and `*.exe`)
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

## Migration History

### From tVeb to miniserve (v0.2.0 → v0.32.0)

**Reason for Migration**:
- tVeb was abandoned (v0.2.0 from 2024, only 17 GitHub stars)
- MIME type handling issues (panicked on `.bat`, `.ps1` files)
- Minimal feature set, not production-ready
- Small community, uncertain future maintenance

**Migration Changes**:
1. Updated `scripts/download-launcher-binaries.sh` to download miniserve binaries
2. Updated all launcher scripts (`.sh`, `.bat`, `.ps1`) to use miniserve CLI
3. Updated `scripts/build-viewer-for-bundle.mjs` to detect miniserve binaries
4. Updated `.gitignore` to ignore miniserve binaries
5. Reorganized bundle structure with `web/` subdirectory (see below)

**Benefits**:
- Production-ready server with 7,300+ stars
- Actively maintained (last release September 2024)
- Proper MIME type handling out of the box
- Rust safety and performance guarantees
- Large community and ongoing development

### Bundle Structure Reorganization

**Issue**: Original structure had launcher scripts mixed with web content
- Web servers tried to serve `.bat` and `.ps1` files
- tVeb panicked on unknown MIME types
- Not a clean separation of concerns

**Solution**: Created `web/` subdirectory
- Launcher scripts stay at root level (for easy user access)
- Web content (viewer, stories, index.html) moved to `web/` subdirectory
- Web server serves only `web/` directory
- Launcher scripts include backward compatibility for legacy bundles

**Files Changed**:
- `packages/editor/src/utils/bundle.ts` - Updated bundle generation
- `packages/editor/public/launcher/run_story_adventure.sh` - Serves from `web/`
- `packages/editor/public/launcher/run_story_adventure.bat` - Serves from `web/`
- `packages/editor/public/launcher/run_story_adventure.ps1` - Serves from `web/`
- `packages/editor/public/launcher/README.md` - Updated documentation
