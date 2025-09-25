# Development Guidelines

## Project Structure and Workflow

### Development Environment

- **No build process**: Pure JavaScript ES6 modules
- **Local development**: Use local HTTP server for file:// protocol limitations
- **Testing**: Manual testing in browser, both editor and viewer
- **Deployment**: Static file hosting (GitHub Pages)

### Code Organization Patterns

#### Module Structure

- ES6 imports/exports throughout
- Shared utilities in `/commons/`
- Tool-specific code in respective directories
- No bundling or transpilation required

#### Naming Conventions

- **Files**: kebab-case (e.g., `file-saver.js`)
- **Variables**: snake_case (e.g., `current_section`)
- **Functions**: snake_case (e.g., `get_story`)
- **CSS Classes**: kebab-case (e.g., `text-editor-container`)

#### File Dependencies

```
commons/
├── common.js       → Action system (core logic)
├── utils.js        → Utility functions
├── storage.js      → LocalStorage abstraction
└── toast.js        → Notification system

editor/
├── code.js         → Imports commons + Cytoscape
└── index.html      → Bootstrap UI + editor layout

viewer/
├── code.js         → Imports commons + marked/DOMPurify
└── index.html      → Bootstrap UI + viewer layout
```

## Contributing Guidelines

### Code Style

- Use semicolons consistently
- Prefer `const`/`let` over `var`
- Use template literals for string interpolation
- Keep functions focused and small
- Comment complex logic blocks

### Testing Strategy

- **Manual testing**: Load stories in both editor and viewer
- **Cross-browser testing**: Chrome, Firefox, Safari, Edge
- **Mobile testing**: Responsive design verification
- **Story validation**: Test all action types and edge cases

### Adding New Features

#### New Action Types

1. Add to `supported_actions` in `commons/common.js`
2. Define parameters and validation
3. Implement action function
4. Test in `stories/test.json`
5. Update documentation

#### UI Enhancements

1. Modify HTML structure in `index.html`
2. Add CSS styling in `style.css`
3. Update JavaScript event handlers
4. Test responsive behavior
5. Verify accessibility

### Library Management

#### Current Dependencies

- Bootstrap 5.3.x (CSS framework)
- Cytoscape.js (graph visualization)
- marked.js (Markdown rendering)
- DOMPurify (HTML sanitization)
- JSZip (file compression)
- FileSaver.js (file downloads)

#### Adding Dependencies

1. Prefer CDN or esm.sh for ES modules
2. Download and vendor for offline capability
3. Update acknowledgments in README
4. Test browser compatibility

## Architecture Decisions

### Why No Build Process?

- **Simplicity**: Direct browser development
- **Transparency**: No hidden transformations
- **Accessibility**: Easy contribution without tooling
- **Performance**: Modern browsers handle ES6 efficiently

### Client-Side Only Design

- **Privacy**: Files never leave user's computer
- **Security**: No server vulnerabilities
- **Portability**: Works offline and on any hosting
- **Cost**: No backend infrastructure needed

### Graph-Based Story Editor

- **Visual clarity**: See story structure at a glance
- **Navigation**: Quick section jumping
- **Validation**: Spot broken links visually
- **Layout**: Automatic graph organization

## Common Development Tasks

### Adding a New Story

1. Create JSON file in `/stories/`
2. Include required `meta` section
3. Add image assets to story subfolder
4. Test in viewer
5. Update `/stories/README.md`

### Modifying Action System

1. Edit `commons/common.js`
2. Update parameter validation
3. Test with `/stories/test.json`
4. Update story format documentation

### UI Changes

1. Modify Bootstrap HTML structure
2. Add custom CSS sparingly
3. Test mobile responsiveness
4. Verify keyboard navigation

### Performance Optimization

- Minimize DOM manipulations
- Lazy load large images
- Use efficient Cytoscape layouts
- Optimize JSON file sizes

## Debugging Tips

### Common Issues

- **Module loading**: Check file paths and CORS
- **Variable interpolation**: Verify ${variable} syntax
- **Graph layout**: Clear cache and reload
- **Story validation**: Check JSON syntax and structure
- **Function exports**: Ensure all functions called across modules are properly exported

### Browser DevTools

- Console for action execution debugging
- Network tab for file loading issues
- Sources for JavaScript debugging
- Application tab for LocalStorage inspection

### Testing Workflow

1. Create minimal test case
2. Test in clean browser session
3. Verify across different browsers
4. Check mobile device behavior
5. Test with large/complex stories
