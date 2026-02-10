# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Viewer E2E tests failing because Vite dev server could not serve story files from the monorepo root `stories/` directory
  - Added `serveMonorepoStories` Vite plugin to `packages/viewer/vite.config.ts` that serves the stories directory at `/stories/` during development
- Fixed ambiguous `getByText('Help')` selector in E2E hotkey test that matched toast notifications in addition to the modal title

### Added
- Toast feedback on "Save Configuration" button click in viewer AI settings (success/error)
- AI Extendable toggle switch in editor section panel with bold "AI Extension" label and tooltip explanation
  - Allows story authors to mark sections as AI-extendable directly in the editor UI
  - Uses a toggle switch (`Form.Check type="switch"`) instead of a small checkbox for better visibility

### Changed
- Redesigned editor layout from left/right split to top/bottom split
  - Graph editor now uses full viewport width (better for wide story graphs)
  - Edit panel appears below the graph with a horizontal multi-column layout
  - Graph fills available height, expanding to full screen when nothing is selected
  - Eliminates wasted whitespace in the lower-left area
- **BREAKING**: Upgraded web server from tVeb to miniserve
  - Replaced tVeb v0.2.0 (17 stars, abandoned) with miniserve v0.32.0 (7,300+ stars, actively maintained)
  - miniserve is production-ready, written in Rust, with proper MIME type handling
  - Updated all launcher scripts to use miniserve with proper command-line arguments
  - Binary size increased from ~1.2MB to ~7-8MB, but worth it for reliability
  - Updated download script to fetch miniserve v0.32.0 binaries
  - Updated build script to detect miniserve binaries instead of tVeb
- Reorganized bundle structure to separate launcher scripts from web content
  - Launcher scripts now serve from `web/` subdirectory containing only viewer, stories, and index.html
  - All launcher scripts (`.sh`, `.bat`, `.ps1`) include backward compatibility for legacy bundles
  - Updated bundle generation code to create new directory structure

### Fixed
- Fixed path resolution issue in bundled stories where relative paths were incorrectly resolved
  - Changed story JSON path in root index.html redirect from `./stories/` to `/stories/`
  - Changed media paths in story JSON from `./stories/` to `/stories/`
  - Paths are now absolute from web root, preventing incorrect resolution when viewer is at `/viewer/`
- Fixed infinite loop in ActionEditor when loading a story
  - Root cause: `useEffect` synced with `script` prop reference instead of content, causing update cycles
  - Fixed by adding deep equality check to only update when action content actually changes
  - Added ref flag to skip effect when changes originate from component itself
- Fixed infinite toast loop when loading editor with saved story
  - Root cause: `ToastContext.Provider` created new value object on every render, causing unstable hook references
  - Fixed by memoizing context value with `useMemo` to ensure stable references
  - Changed toast ID counter from state to `useRef` to prevent duplicate IDs when toasts are shown rapidly
- Removed stale compiled `.js` files from src/ directories that were shadowing `.tsx` source files
- Updated `.gitignore` to prevent tracking compiled `.js` files in src/ directories

### Added
- AI story extension feature (viewer only)
  - Stories can mark sections as AI-extendable for dynamic LLM-powered story expansion
  - New data model fields: `Section.ai_extendable`, `Section.ai_gen`, `StoryMeta.ai_gen_look_ahead`, `StoryMeta.characters`
  - **Security-first design**: LLM endpoint configuration (URL, API key) stored in browser localStorage only, never in story files
  - LLM endpoint configuration UI in viewer menu screen settings accordion
  - User consent dialog on story load for AI-capable stories with explicit privacy warning
  - AI expansion preference toggle on menu screen with localStorage persistence
  - Look-ahead engine performs BFS traversal to find `ai_extendable` sections within configurable range
  - OpenAI-compatible streaming API client with SSE parsing and error handling
  - LLM prompt builder with system and user prompts optimized for branching narrative generation
  - Story validator ensures AI-generated updates preserve existing content and maintain graph integrity
  - Automatic image prompt generation (`ai_gen`) for new sections to support visual consistency
  - Character profile tracking in metadata for behavioral consistency across AI-generated paths
- Modern modal system using React Bootstrap for dialogs and notifications
- Build artifact cleanup scripts in all packages
  - Added `clean` script to each package's `package.json`
  - Root-level `pnpm clean` to clean all packages at once
  - Removes `dist/`, `.vite/`, `playwright-report/`, `test-results/`, `coverage/`
  - `DialogContext` and `useDialog` hook for programmatic alert, confirm, and prompt modals
  - `ToastContainer` and `useToast` hook for non-blocking toast notifications
  - Modal components in both editor and viewer packages
- Comprehensive test coverage for toast system and infinite loop prevention
  - Unit tests for ToastContainer in both editor and viewer (7 tests each)
  - E2E tests for toast behavior in editor (7 scenarios including infinite loop detection)
  - Tests verify stable hook references and proper toast display
- Self-contained launcher infrastructure for playable bundles
  - Downloaded tVeb web server binaries (v0.2.0) for Windows and Linux
  - Created launch scripts: `run_story_adventure.sh` (Linux/macOS), `run_story_adventure.bat` and `run_story_adventure.ps1` (Windows)
  - Created `launcher/README.md` with usage documentation and troubleshooting
  - Created `scripts/download-launcher-binaries.sh` script to fetch web server binaries
  - Added `download:launcher-binaries` npm script for easy binary download
  - Updated bundle generation to include launcher files in ZIP bundles
  - Bundles now launchable without additional software installation

### Changed
- Replaced primitive browser `alert()`, `confirm()`, and `prompt()` with modern React Bootstrap modals
  - Editor: Updated `App.tsx`, `VariablesPanel.tsx`, and `LinearizeDialog.tsx` to use toast and dialog hooks
  - Viewer: Updated `App.tsx` and `useStoryPlayer.ts` to use toast and dialog hooks
  - INPUT action in viewer now uses modal prompt instead of browser prompt
  - Success/info messages now display as Bootstrap toasts instead of alerts
- Updated `build-viewer-for-bundle.mjs` to include launcher files in manifest
  - Binary files (tVeb executables) stored as base64 in manifest
  - Script files included as text in manifest
- Updated `bundle.ts` to place launcher files at top level of ZIP bundles (not in subfolder)
  - Binary files properly decoded from base64 when creating bundle
  - Launcher files immediately visible when extracting bundle
- Updated launch scripts to run from bundle root directory
  - `run_story_adventure.sh` - Updated paths for root-level execution
  - `run_story_adventure.bat` - Updated paths for root-level execution
  - `run_story_adventure.ps1` - Updated paths for root-level execution
- Updated `launcher/README.md` to reflect top-level file locations and usage
- Updated root `README.md` with launcher documentation and bundle usage instructions

### Changed
- Improved `.gitignore` patterns for better build artifact exclusion
  - Now ignores all `dist/` directories including `packages/shared/dist/`
  - Added patterns for `.vite/`, `coverage/`, and generated files
  - Consolidated test output patterns with wildcards

### Fixed
- Removed tracked build artifacts from git history
  - Untracked `playwright-report/`, `test-results/`, and `dist/` directories
  - Removed generated `packages/editor/public/viewer-dist/` from tracking
- Fixed infinite toast loop in editor when loading saved story
  - Modified `ToastContainer.tsx` in both editor and viewer to use functional state updates for toast ID generation
  - Removed `nextId` from `showToast` dependency array to prevent context value from changing on every toast
  - Toast functions now maintain stable references, preventing useEffect re-triggering
- Fixed VariablesPanel component tests
  - Wrapped test components with `DialogProvider` to provide required context
  - Updated delete test to properly handle async modal confirmation dialog
  - All 7 VariablesPanel tests now passing
- Fixed ES module `__dirname` issues in all E2E test files
  - Added proper `fileURLToPath` and `dirname` imports for ES modules
  - Updated: `editor-load.spec.ts`, `editor-edit.spec.ts`, `editor-bundle.spec.ts`, `editor-toast.spec.ts`
- Fixed bundle export path issues by configuring viewer to use relative paths (`base: './'` in Vite config)
  - Assets now correctly resolve when viewer is in `/viewer/` subdirectory of bundle
  - Changed favicon reference from absolute to relative path

### Changed
- **Phase 6: Polish and Cleanup**
  - Refactored to modern TypeScript + React + Vite monorepo structure
  - Replaced Cytoscape.js with React Flow (`@xyflow/react`) for graph editing
  - Replaced vendored dependencies with npm packages (proper dependency management)
  - Removed old vendored files (`commons/`, `editor/`, `viewer/` directories)
  - Updated project structure: now uses pnpm workspaces with `packages/shared/`, `packages/editor/`, `packages/viewer/`
  - Updated documentation: README.md reflects monorepo structure and new development workflow

### Added
- **Phase 6: Polish and Cleanup**
  - Comprehensive test suite (Vitest unit tests + Playwright E2E tests)
  - TypeScript type safety across entire codebase
  - Improved development experience with Vite HMR (Hot Module Replacement)
  - Package-level README files for better documentation
  - Upgrade guide (`UPGRADE.md`) for migration from old version

### Added
- **Phase 5: Bundle Generation**
  - Created build pipeline for viewer bundle:
    - `scripts/build-viewer-for-bundle.mjs`: Builds viewer, copies dist to editor public, generates manifest
    - `package.json` script: `build:viewer-for-bundle`
    - Generates `viewer-bundle-manifest.json` with all viewer files as strings for offline ZIP generation
  - Created `bundle.ts`: Bundle generation utilities
    - `downloadAsIs(story)`: Download story JSON as-is
    - `downloadGraphInOne(story)`: Download story with all external images embedded as data URLs
    - `downloadGraphSplit(story)`: Generate playable bundle ZIP with viewer, story, and extracted images
    - `downloadLinearStory(story, startAt, endAt, passingThrough)`: Create linear markdown export
    - `depthFirstSearch()`: DFS algorithm for finding paths through story graph
    - `markdownFromSectionIdList()`: Convert section list to markdown format
  - Created `LinearizeDialog.tsx`: Dialog component for linear story generation
    - Prompts for start section, end section, and sections to pass through
    - Validates section IDs and generates markdown export
  - Updated `Navbar.tsx`: Added download menu items
    - "Save Adventure as it is" → `downloadAsIs`
    - "Save Adventure with all images in one file" → `downloadGraphInOne`
    - "Generate playable adventure bundle" → `downloadGraphSplit`
    - "Create Linear Story" → opens `LinearizeDialog`
  - Updated `App.tsx`: Wired bundle functions into File menu handlers
  - Added Vitest unit tests: `bundle.test.ts`
    - Tests DFS linearization, markdown conversion, JSON download
  - Added Playwright E2E tests: `editor-bundle.spec.ts`
    - Tests JSON download, bundle ZIP generation, ZIP structure validation, linear story dialog

### Fixed
- Fixed TypeScript errors in `ActionEditor.tsx`: added JSX namespace import, fixed unused variable, added null check for parameter types
- Fixed `VariablesPanel.test.tsx` test failure: updated test to handle split text content in variable display

### Added
- **Phase 4: Advanced Editor Features**
  - Created `ActionEditor.tsx`: Action script editing UI component
    - Supports all 11 action types (NONE, INPUT, SET, ADD_TO_VARIABLE, COMPARE_DO, IF_SET_DO, IF_NOT_SET_DO, ADD_CHOICE, REMOVE_CHOICE, IF_SET_ADD_CHOICE, IF_SET_REMOVE_CHOICE)
    - Parameter inputs based on type: STRING (text), VARIABLE (dropdown), SECTION (dropdown), ENUM (dropdown), ACTION (recursive nested editor)
    - Add/delete actions, edit action types and parameters
  - Created `VariablesPanel.tsx`: Story variables management modal
    - Add/edit/delete variables
    - Display all variables with current values
    - Integrated into Navbar → Story Variables menu
  - Created `StoryJsonModal.tsx`: Modal displaying formatted story JSON
    - Shows current story state as formatted JSON
    - Accessible via File → Display Current Story JSON
  - Enhanced `SectionPanel.tsx`:
    - Integrated `ActionEditor` for editing section scripts
    - Enhanced media handling: "Load Picture" button, "Remove Media" button, image preview
    - Image paste support: paste image in text area to add media
    - Media URL input field for external URLs
  - Created `mediaHandler.ts`: Utility for handling image paste from clipboard
  - Updated `useStoryState.ts`: Added variable CRUD operations (`setVariables`, `setVariable`, `deleteVariable`)
  - Updated `Navbar.tsx`: Added "Story Variables" menu and "Display Current Story JSON" menu item
  - Added Vitest unit tests:
    - `ActionEditor.test.tsx`: Test action creation, editing, deletion for each action type
    - `VariablesPanel.test.tsx`: Test variable CRUD operations

- **Phase 3: Editor port to React Flow**
  - Created `@story-adventure/editor` package with React 19 + TypeScript + Vite + React Flow
  - Ported editor from Cytoscape.js to React Flow (`@xyflow/react` v12)
  - Created core React components:
    - `App.tsx`: Main app managing story state, loads/saves to IndexedDB
    - `Navbar.tsx`: File/Edit menus (New, Load, Save, Add Section, Redraw)
    - `GraphEditor.tsx`: React Flow canvas wrapper with custom nodes/edges
    - `SectionNode.tsx`: Custom node component for story sections (shows ID, highlights on selection, styles root/leaf nodes)
    - `ChoiceEdge.tsx`: Custom edge component for choices (shows choice text as label)
    - `SectionPanel.tsx`: Right sidebar for editing selected node/edge (text editor, media controls, delete button)
  - Created React hooks:
    - `useStoryState.ts`: Story state management (CRUD for sections, choices)
    - `useAutoSave.ts`: Auto-save to IndexedDB every 30s
    - `useHotkeys.ts`: Editor hotkeys (s for add section, m for load media, arrow keys for navigation)
  - Created utility functions:
    - `storyToFlow.ts`: Convert Story to React Flow nodes/edges
    - `flowToStory.ts`: Sync React Flow changes back to Story
    - `graph-layout.ts`: dagre layout to position nodes (hierarchical left-to-right, replaces Klay)
    - `fileLoader.ts`: Load JSON/image files from file system
    - `fileSaver.ts`: Save story as JSON file
  - Ported editor styles from `editor/style.css` to `src/index.css`
  - Implemented graph editing features:
    - Graph rendering: Convert story sections to React Flow nodes and edges
    - Auto-layout: Use dagre to position nodes (hierarchical left-to-right layout)
    - Node selection: Click node → open section panel with text editor
    - Edge selection: Click edge → open choice editor
    - Add section: Create new section node (File → Add Section or hotkey 's')
    - Add choice: From section panel, add edge from current section to another section
    - Delete: Delete selected node or edge (updates story and graph)
    - Text editing: Live text editor for section `text_lines` or choice `text`
    - Keyboard navigation: Arrow keys to navigate between nodes
  - Added Vitest unit tests:
    - `storyToFlow.test.ts`: Verify Story → nodes/edges conversion
    - `graph-layout.test.ts`: Verify dagre produces valid positions
  - Added Playwright E2E tests:
    - `editor-load.spec.ts`: Load example story, verify correct node count, verify nodes render
    - `editor-edit.spec.ts`: Click node, edit text, verify change persists, add node, add edge, delete node

### Fixed
- Fixed missing `#choices_row` ID in `ChoiceButtons` component that caused E2E test failures
- Fixed incorrect use of `useMemo` for side effects in `GraphEditor.tsx` (changed to `useEffect` for updating nodes/edges when props change)

### Added
- Initialized `Changelog.md` following Keep a Changelog conventions
- **Phase 1: Monorepo setup and shared package**
- **Phase 2: Viewer port to React + TypeScript**
  - Created `@story-adventure/viewer` package with React 19 + TypeScript + Vite
  - Ported viewer from vanilla JS (`viewer/code.js`) to React components:
    - `App.tsx`: Main app component managing viewer state and coordination
    - `MenuScreen.tsx`: Initial screen with "Load a Story Adventure" button
    - `StoryPlayer.tsx`: Main story display with markdown rendering (marked + DOMPurify)
    - `ChoiceButtons.tsx`: Choice buttons for navigation
    - `HelpModal.tsx`: Hotkey help modal (Bootstrap modal)
    - `BackgroundImage.tsx`: Full-screen background image display
  - Created React hooks:
    - `useStoryPlayer.ts`: Story state management, navigation, history tracking
    - `useHotkeys.ts`: Keyboard hotkeys (b/n/s/l/f/h/?) with aliases
  - Ported viewer styles from `viewer/style.css` to `src/index.css`
  - Implemented story loading from file input and URL query param (`?load=...`)
  - Implemented action execution when entering sections (using shared `execute_actions`)
  - Implemented variable interpolation in text and choices (using shared `replace_variables`)
  - Overrode INPUT action to use `prompt()` for user input
  - Implemented save/load progress functionality
  - Implemented full-screen toggle and text visibility toggle
  - Added Vitest component tests:
    - `StoryPlayer.test.tsx`: Renders section text correctly with markdown
    - `ChoiceButtons.test.tsx`: Renders choices and handles clicks
    - `MenuScreen.test.tsx`: Shows load button and help text
  - Added Playwright E2E tests:
    - `viewer-load.spec.ts`: Load all 5 example stories via query param
    - `viewer-navigate.spec.ts`: Click choices to navigate, test back navigation
    - `viewer-hotkeys.spec.ts`: Test keyboard shortcuts (b, n, f, h, ?)
  - Configured Vite dev server on port 5174
  - Configured Vitest with jsdom environment for component tests
  - Configured Playwright for E2E testing

### Changed
  - Created pnpm workspace structure with `pnpm-workspace.yaml`
  - Added root `package.json` with workspace scripts (`dev`, `build`, `test`, `test:e2e`, `typecheck`, `lint`, `verify`)
  - Created `tsconfig.base.json` with shared TypeScript configuration (strict mode, ES2021+)
  - Created `@story-adventure/shared` package with TypeScript types and utilities:
    - `types.ts`: TypeScript interfaces for Story, Section, Choice, Media, Action, Variable, StoryState, StoryMeta
    - `actions.ts`: Ported action system from `commons/common.js` with full TypeScript types (all 11 action types: SET, INPUT, ADD_TO_VARIABLE, COMPARE_DO, IF_SET_DO, IF_NOT_SET_DO, ADD_CHOICE, REMOVE_CHOICE, IF_SET_ADD_CHOICE, IF_SET_REMOVE_CHOICE)
    - `utils.ts`: Ported utility functions from `commons/utils.js` (`get_text_from_section`, `get_file_safe_title`)
    - `variables.ts`: Variable interpolation logic (`replace_variables` function)
    - `storage.ts`: Ported IndexedDB storage utilities from `commons/storage.js` with proper TypeScript types
  - Added comprehensive Vitest test suite:
    - Tests for all action types and edge cases
    - Tests for variable interpolation with all operators
    - Tests for `compare()` function with all comparison operators (=, !=, <, >, <=, >=)
    - Tests for utility functions
    - Type validation tests for all 5 example story JSON files
  - Added JSDoc documentation to all exported functions and types
  - Created README for shared package

### Changed
- Restructured root `README.md`: added project structure overview, usage/local dev section, removed emojis, fixed typos
- Improved `editor/README.md`: added key technical details, fixed typo in "contribution"
- Improved `viewer/README.md`: added feature summary, added cross-reference to stories collection, fixed typo in "contribution"
- Added cross-reference to editor in `stories/README.md`
