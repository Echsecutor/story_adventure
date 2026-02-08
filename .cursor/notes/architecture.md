# Technical Architecture

## Component Overview

The Story Adventure Tools follows a modular client-side architecture with three main packages in a pnpm monorepo:

### 1. Editor (`packages/editor/`)

- **Purpose**: Visual story creation and editing tool
- **Technology**: React 19 + TypeScript + Vite + React Flow
- **Key Files**:
  - `src/main.tsx` - Application entry point
  - `src/App.tsx` - Main app component managing story state
  - `src/components/GraphEditor.tsx` - React Flow canvas wrapper
  - `src/components/nodes/SectionNode.tsx` - Custom node component
  - `src/components/edges/ChoiceEdge.tsx` - Custom edge component
  - `src/components/panels/SectionPanel.tsx` - Section editing sidebar
  - `src/components/panels/ActionEditor.tsx` - Action script editor
  - `src/components/modals/DialogContext.tsx` - Modal dialog system (alert/confirm/prompt)
  - `src/components/modals/ToastContainer.tsx` - Toast notification system
  - `src/utils/bundle.ts` - Bundle generation (ZIP export)
  - `public/launcher/` - Self-contained launcher infrastructure
    - `tVeb-linux-x86_64` - Web server binary for Linux (1.2 MB)
    - `tVeb-windows-x86_64.exe` - Web server binary for Windows (1.4 MB)
    - `run_story_adventure.sh` - Bash launcher script for Linux/macOS
    - `run_story_adventure.bat` - Batch launcher script for Windows
    - `run_story_adventure.ps1` - PowerShell launcher script for Windows
    - `README.md` - Launcher usage documentation

**Core Features**:

- Graph-based story visualization using React Flow with dagre layout algorithm
- Section editing with rich text, media embedding, and action scripting
- Real-time story validation and JSON export/import
- Bundle creation for distributable story packages (includes viewer + launcher)
- Self-contained launcher with embedded web server (tVeb v0.2.0) for instant playability
- Modern modal dialogs and toast notifications (React Bootstrap)

### 2. Viewer (`packages/viewer/`)

- **Purpose**: Story playback and user interaction
- **Technology**: React 19 + TypeScript + Vite
- **Key Files**:
  - `src/main.tsx` - Application entry point
  - `src/App.tsx` - Main app component coordinating viewer state
  - `src/components/StoryPlayer.tsx` - Story text display with markdown
  - `src/components/ChoiceButtons.tsx` - Choice navigation buttons
  - `src/components/modals/DialogContext.tsx` - Modal dialog system (alert/confirm/prompt)
  - `src/components/modals/ToastContainer.tsx` - Toast notification system
  - `src/hooks/useStoryPlayer.ts` - Story state management hook
  - `src/hooks/useHotkeys.ts` - Keyboard hotkey handling

**Core Features**:

- Markdown rendering with DOMPurify sanitization
- State persistence and save/load functionality (IndexedDB)
- Media display (images, videos) with responsive design
- Keyboard navigation and hotkey support
- Modern modal dialogs and toast notifications (React Bootstrap)

### 3. Shared (`packages/shared/`)

- **Purpose**: Shared TypeScript types, utilities, and business logic
- **Technology**: TypeScript (no React dependencies)
- **Key Files**:
  - `src/types.ts` - TypeScript interfaces for Story, Section, Choice, Action, etc.
  - `src/actions.ts` - Action system implementation and story execution logic
  - `src/utils.ts` - File handling, text processing helpers
  - `src/variables.ts` - Variable interpolation logic
  - `src/storage.ts` - IndexedDB abstraction for story and progress persistence

## Action System Architecture

The action system (`packages/shared/src/actions.ts`) provides dynamic story behavior through a plugin-like architecture:

```typescript
export const supported_actions: SupportedActions = {
  INPUT: { parameters: ["VARIABLE", "STRING"], action: set_variable },
  SET: { parameters: ["VARIABLE", "STRING"], action: set_variable },
  COMPARE_DO: {
    parameters: ["VARIABLE", "ENUM", "STRING", "ACTION"],
    action: conditional_execution,
  },
  // ... 8 more action types
};
```

**Key Actions**:

- `INPUT` - Prompt user for variable input (overridden in viewer with modal prompt dialog)
- `SET` - Assign values to story variables
- `ADD_TO_VARIABLE` - Append numeric value to existing variables
- `COMPARE_DO` - Conditional logic execution based on comparison
- `IF_SET_DO` / `IF_NOT_SET_DO` - Conditional execution based on variable state
- `ADD_CHOICE` / `REMOVE_CHOICE` - Dynamic choice manipulation
- `IF_SET_ADD_CHOICE` / `IF_SET_REMOVE_CHOICE` - Conditional choice manipulation

## UI/UX Components

### Modal Dialog System

Both editor and viewer packages include a modern modal system built with React Bootstrap:

**DialogContext (`components/modals/DialogContext.tsx`)**:
- Context provider wrapping the entire app (in `main.tsx`)
- `useDialog()` hook provides programmatic API for modals
- Methods: `alert(message, title?)`, `confirm(message, title?)`, `prompt(message, defaultValue?, title?)`
- All methods return promises for clean async/await patterns
- Replaces primitive browser `alert()`, `confirm()`, and `prompt()`

**ToastContainer (`components/modals/ToastContainer.tsx`)**:
- Context provider for non-blocking notifications
- `useToast()` hook provides notification API
- Methods: `toastOk(message)`, `toastAlert(message)`, `toastInfo(message)`
- Auto-dismissing toasts with 5-second timeout
- Positioned in top-right corner with color-coded variants (success, danger, info)

**Usage Example**:
```typescript
const dialog = useDialog();
const toast = useToast();

// Alert modal
await dialog.alert('Story saved successfully!');

// Confirm modal
const confirmed = await dialog.confirm('Delete this section?');
if (confirmed) { /* ... */ }

// Prompt modal
const userInput = await dialog.prompt('Enter variable value:', 'default');
if (userInput !== null) { /* ... */ }

// Toast notifications
toast.toastOk('Story loaded');
toast.toastAlert('Invalid JSON format');
toast.toastInfo('Press ? for help');
```

**Special Integration**:
- Viewer's INPUT action overrides `supported_actions.INPUT.action` to use modal prompt
- Replaces blocking browser `prompt()` with async React Bootstrap modal
- Provides better UX with consistent styling and keyboard navigation

## Data Flow

### Editor Workflow

1. User interaction → Graph manipulation → Story object update
2. Story validation → Real-time feedback → JSON serialization
3. Media embedding → Base64 encoding → Bundle generation

### Viewer Workflow

1. Story loading → State initialization → Section rendering
2. User choice → Action execution → State update → Progress save
3. Navigation → History management → Section transition

## Dependencies and Libraries

### Core Libraries

- **React 19** - UI framework
- **TypeScript** - Type safety across codebase
- **Vite** - Build tool with HMR
- **React Flow** (`@xyflow/react`) - Graph editor (replaces Cytoscape.js)
- **Bootstrap 5** (via `react-bootstrap`) - UI framework and responsive design
- **marked.js** - Markdown to HTML conversion (viewer only)
- **DOMPurify** - HTML sanitization for security

### Utility Libraries

- **JSZip** - Story bundle creation and extraction
- **FileSaver.js** - Client-side file download
- **@dagrejs/dagre** - Graph layout algorithm (hierarchical left-to-right)

### Testing Libraries

- **Vitest** - Unit and component test runner
- **Playwright** - E2E testing framework
- **React Testing Library** - Component testing utilities

## Build and Deployment

**Build Process**: Vite-based build system
- Editor: `pnpm --filter editor build` → `packages/editor/dist/`
- Viewer: `pnpm --filter viewer build` → `packages/viewer/dist/`
- Bundle generation: `pnpm build:viewer-for-bundle` → copies viewer dist to editor public

**Deployment**: Static hosting (GitHub Pages) with CORS-enabled file access
**Development**: Vite dev servers with HMR
- Editor: `http://localhost:5173`
- Viewer: `http://localhost:5174`

## Security Considerations

- **Client-side only**: No server communication, files remain local
- **HTML sanitization**: DOMPurify prevents XSS in user-generated content
- **File type validation**: Restricted to supported media formats
- **Data URLs**: Base64 encoding for embedded media prevents external resource loading

## Bundle Generation Strategy

The editor generates playable adventure bundles (ZIP files) that include:

1. **Launcher infrastructure** - Self-contained web server and launch scripts (at root level)
   - `README.md` - Usage documentation
   - `run_story_adventure.sh` - Bash launcher script for Linux/macOS
   - `run_story_adventure.bat` - Batch launcher script for Windows
   - `run_story_adventure.ps1` - PowerShell launcher script for Windows
   - `tVeb-linux-x86_64` - Web server binary for Linux (~1.2 MB)
   - `tVeb-windows-x86_64.exe` - Web server binary for Windows (~1.4 MB)
2. **Root index.html** - Redirect to viewer with auto-load of story
3. **Viewer bundle** - Pre-built viewer dist files in `viewer/` subdirectory
4. **Story JSON** - The story file in `stories/<story-name>/<story-name>.json`
5. **Media files** - Extracted images from story sections in `stories/<story-name>/`
6. **Manifest** - `viewer-bundle-manifest.json` maps viewer and launcher file paths to content (for offline ZIP generation)

The build script (`scripts/build-viewer-for-bundle.mjs`) generates the manifest at build time, including both viewer files (as text) and launcher binaries (as base64), allowing the editor to create ZIP files without fetching files at runtime.

**Binary Handling**: Launcher binaries (`.exe` files and `tVeb-*` files) are stored as base64 in the manifest and decoded when creating the bundle.

**Critical Configuration**: The viewer's `vite.config.ts` must have `base: './'` to use relative paths for assets. This ensures the viewer works correctly when bundled in a subdirectory structure (e.g., `/viewer/` folder within the ZIP), allowing assets to resolve from `./assets/` instead of absolute paths from root.

**Web Server**: Bundles use tVeb (Tiniest Veb Server) v0.2.0, a minimal (~1.5 MB) open-source static file server written in V. Download binaries via `pnpm download:launcher-binaries` before building bundles.

## Input Handling Best Practices

- **Prompt Cancellation**: All `prompt()` calls properly handle `null` return values when user cancels
  - Editor variable editing and story creation functions
  - Viewer INPUT action - cancellation does not modify variables
- **Empty vs Null**: Distinguish between empty string input (valid) and cancelled input (null)
