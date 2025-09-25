# Technical Architecture

## Component Overview

The Story Adventure Tools follows a modular client-side architecture with three main components:

### 1. Editor (`/editor/`)

- **Purpose**: Visual story creation and editing tool
- **Key Files**:
  - `code.js` - Main application logic, graph manipulation, UI event handling
  - `index.html` - Bootstrap-based UI with modal dialogs and navigation
  - `style.css` - Custom styling for graph visualization and editor UI

**Core Features**:

- Graph-based story visualization using Cytoscape.js with Klay layout algorithm
- Section editing with rich text, media embedding, and action scripting
- Real-time story validation and JSON export/import
- Bundle creation for distributable story packages

### 2. Viewer (`/viewer/`)

- **Purpose**: Story playback and user interaction
- **Key Files**:
  - `code.js` - Story state management, choice handling, progress tracking
  - `index.html` - Responsive UI for story display and navigation
  - `style.css` - Story presentation styling and mobile optimization

**Core Features**:

- Markdown rendering with DOMPurify sanitization
- State persistence and save/load functionality
- Media display (images, videos) with responsive design
- Keyboard navigation and hotkey support

### 3. Commons (`/commons/`)

- **Purpose**: Shared utilities and business logic
- **Key Files**:
  - `common.js` - Action system implementation and story execution logic
  - `utils.js` - File handling, text processing, DOM manipulation helpers
  - `storage.js` - LocalStorage abstraction for story and progress persistence
  - `toast.js` - Notification system for user feedback

## Action System Architecture

The action system (`common.js`) provides dynamic story behavior through a plugin-like architecture:

```javascript
supported_actions = {
  INPUT: { parameters: ["VARIABLE", "STRING"], action: set_variable },
  SET: { parameters: ["VARIABLE", "STRING"], action: set_variable },
  COMPARE_DO: {
    parameters: ["VARIABLE", "ENUM", "STRING", "ACTION"],
    action: conditional_execution,
  },
};
```

**Key Actions**:

- `INPUT` - Prompt user for variable input
- `SET` - Assign values to story variables
- `ADD_TO_VARIABLE` - Append to existing variables
- `COMPARE_DO` - Conditional logic execution

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

- **Bootstrap 5** - UI framework and responsive design
- **Cytoscape.js** - Graph visualization (editor only)
- **marked.js** - Markdown to HTML conversion (viewer only)
- **DOMPurify** - HTML sanitization for security

### Utility Libraries

- **JSZip** - Story bundle creation and extraction
- **FileSaver.js** - Client-side file download
- **esm.sh** - ES module conversion for legacy packages

## Build and Deployment

**No Build Process**: Project uses native ES6 modules and runs directly in browsers
**Deployment**: Static hosting (GitHub Pages) with CORS-enabled file access
**Development**: Local file serving required for module imports and file operations

## Security Considerations

- **Client-side only**: No server communication, files remain local
- **HTML sanitization**: DOMPurify prevents XSS in user-generated content
- **File type validation**: Restricted to supported media formats
- **Data URLs**: Base64 encoding for embedded media prevents external resource loading
