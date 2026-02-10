# Development Guidelines

## Project Structure and Workflow

### Development Environment

- **Monorepo**: pnpm workspaces with three packages (`shared`, `editor`, `viewer`)
- **Build tool**: Vite with HMR (Hot Module Replacement)
- **Type system**: TypeScript with strict mode
- **Testing**: Vitest (unit/component) + Playwright (E2E)
- **Deployment**: Static file hosting (GitHub Pages)

### Code Organization Patterns

#### Monorepo Structure

```
story_adventure/
├── packages/
│   ├── shared/          → Shared types, utilities, action system
│   ├── editor/          → React Flow graph editor
│   └── viewer/          → React story player
├── scripts/             → Build scripts
└── stories/             → Example stories
```

#### Module Structure

- TypeScript modules with ES6 imports/exports
- Shared code in `packages/shared/` (imported by editor/viewer)
- Package-specific code in respective `packages/*/src/` directories
- Vite handles bundling and transpilation

#### Naming Conventions

- **Files**: kebab-case (e.g., `use-story-state.ts`)
- **Variables**: camelCase (TypeScript convention, e.g., `currentSection`)
- **Functions**: camelCase (e.g., `getStory`)
- **CSS Classes**: kebab-case (e.g., `text-editor-container`)
- **Components**: PascalCase (e.g., `StoryPlayer.tsx`)

#### Package Dependencies

```
packages/shared/         → No dependencies (pure TypeScript)
packages/viewer/         → Depends on @story-adventure/shared
packages/editor/         → Depends on @story-adventure/shared
```

## Contributing Guidelines

### Code Style

- TypeScript strict mode enabled
- Use semicolons consistently
- Prefer `const`/`let` over `var`
- Use template literals for string interpolation
- Keep functions focused and small
- Comment complex logic blocks
- Use TypeScript types/interfaces for all data structures

### Testing Strategy

**Unit Tests (Vitest)**:
- Shared package: Action system, variable interpolation, utilities
- Editor: Story-to-Flow conversion, bundle generation, layout algorithms
- Viewer: Component rendering, markdown sanitization

**E2E Tests (Playwright)**:
- Story loading: All 5 example stories load correctly
- Viewer navigation: Choices, hotkeys, save/load progress
- Editor editing: Graph manipulation, text editing, actions, variables, bundle generation

**Manual Testing**:
- Cross-browser testing: Chrome, Firefox, Safari, Edge
- Mobile testing: Responsive design verification
- Story validation: Test all action types and edge cases

### Adding New Features

#### New Action Types

1. Add to `supported_actions` in `packages/shared/src/actions.ts`
2. Define TypeScript types for parameters
3. Implement action function with proper typing
4. Add unit tests in `packages/shared/src/__tests__/actions.test.ts`
5. Test in `stories/test.json`
6. Update documentation

#### UI Enhancements

1. Create/modify React components in `packages/*/src/components/`
2. Add CSS styling in `packages/*/src/index.css`
3. Update TypeScript event handlers
4. Add component tests (Vitest) and E2E tests (Playwright)
5. Test responsive behavior
6. Verify accessibility

### Library Management

#### Current Dependencies

- React 19 + React DOM (UI framework)
- React Flow (`@xyflow/react`) (graph editor)
- Bootstrap 5.3.x + react-bootstrap (CSS framework)
- marked.js (Markdown rendering)
- DOMPurify (HTML sanitization)
- JSZip (file compression)
- FileSaver.js (file downloads)
- @dagrejs/dagre (graph layout)

#### Adding Dependencies

1. Add to appropriate package's `package.json`:
   ```bash
   pnpm --filter <package-name> add <dependency>
   ```
2. For dev dependencies:
   ```bash
   pnpm --filter <package-name> add -D <dependency>
   ```
3. Update acknowledgments in README
4. Test browser compatibility

## Architecture Decisions

### Why React + TypeScript?

- **Type safety**: Catch errors at compile time
- **Component reusability**: Shared components between editor/viewer
- **Modern tooling**: Vite HMR for fast development
- **Ecosystem**: Rich library ecosystem (React Flow, react-bootstrap)

### Why React Flow over Cytoscape.js?

- **Built for editing**: React Flow is designed for node editors, not just visualization
- **React integration**: Native React components for nodes/edges
- **TypeScript support**: Full type definitions
- **Active maintenance**: Regularly updated, better documentation
- **Layout algorithms**: Supports dagre (hierarchical) and d3-hierarchy layouts

### Client-Side Only Design

- **Privacy**: Files never leave user's computer
- **Security**: No server vulnerabilities
- **Portability**: Works offline and on any hosting
- **Cost**: No backend infrastructure needed

### Graph-Based Story Editor

- **Visual clarity**: See story structure at a glance
- **Navigation**: Quick section jumping
- **Validation**: Spot broken links visually
- **Layout**: Automatic graph organization with dagre

## Common Development Tasks

### Adding a New Story

1. Create JSON file in `/stories/`
2. Include required `meta` section
3. Add image assets to story subfolder
4. Test in viewer: `pnpm --filter viewer dev`
5. Update `/stories/README.md`

### Modifying Action System

1. Edit `packages/shared/src/actions.ts`
2. Update TypeScript types in `packages/shared/src/types.ts`
3. Update unit tests in `packages/shared/src/__tests__/actions.test.ts`
4. Test with `/stories/test.json`
5. Update story format documentation

### UI Changes

1. Modify React components in `packages/*/src/components/`
2. Add custom CSS in `packages/*/src/index.css`
3. Add component tests (Vitest) and E2E tests (Playwright)
4. Test mobile responsiveness
5. Verify keyboard navigation

### Running Tests

```bash
# Unit tests (all packages)
pnpm test

# E2E tests (all packages)
pnpm test:e2e

# Type check (all packages)
pnpm typecheck

# Full verification
pnpm verify

# Clean build artifacts
pnpm clean
```

### Build Artifact Management

All build artifacts are automatically ignored by `.gitignore` and can be cleaned with `pnpm clean`:

**Ignored directories:**
- `dist/` - Build outputs from Vite and TypeScript compiler
- `.vite/` - Vite cache
- `playwright-report/` - Playwright test reports
- `test-results/` - Playwright test results
- `coverage/` - Test coverage reports
- `packages/editor/public/viewer-dist/` - Generated viewer bundle for editor

**Cleaning:**
```bash
# Clean all packages
pnpm clean

# Clean specific package
pnpm --filter editor clean
```

### Performance Optimization

- Minimize React re-renders (use `useMemo`, `useCallback`)
- Lazy load large images
- Use efficient dagre layouts for graph
- Optimize JSON file sizes
- Code splitting with Vite (automatic)

## Debugging Tips

### Common Issues

- **Type errors**: Run `pnpm typecheck` to see TypeScript errors
- **Module loading**: Check import paths and package.json dependencies
- **Variable interpolation**: Verify ${variable} syntax
- **Graph layout**: Clear cache and reload, check dagre layout parameters
- **Story validation**: Check JSON syntax and structure against TypeScript types
- **React Flow errors**: Check node/edge data structure matches React Flow types
- **react-bootstrap OverlayTrigger/Tooltip**: These components may silently fail with React 19 due to ref forwarding incompatibility. Use native `title` attributes or `Form.Text` for help text instead. Other react-bootstrap components (Form, Button, etc.) work fine.
- **Stale `.js` files shadowing `.tsx` sources**: `tsconfig.base.json` has `noEmit: true` to prevent `tsc` from emitting `.js` files next to `.tsx` sources (since Vite handles compilation). The shared package overrides this with `noEmit: false` because it needs to emit to `dist/`. The `clean` scripts in all packages delete any stale `.js` files from `src/`. Root `dev` script runs `clean` first as a safeguard.
- **Story files not loading in dev server**: The viewer Vite config includes a `serveMonorepoStories` plugin that serves `../../stories/` at `/stories/`. Without this, `/?load=../stories/...` URLs fail because the dev server root is `packages/viewer/`
- **Infinite loops with useEffect**: Two common patterns to avoid:
  1. **Unstable context references**: When using context values (like `toast` from `useToast()`) in `useEffect` dependencies, ensure the context value has stable references by memoizing with `useMemo` and using functional state updates in `useCallback` hooks
  2. **Prop sync loops**: When syncing component state with props via `useEffect`, use deep equality checks instead of reference equality. Example: `ActionEditor` uses `areActionsEqual()` to compare content, not array references. Also use a ref flag to skip effect when changes originate from component itself

### Browser DevTools

- Console for action execution debugging
- Network tab for file loading issues
- Sources for TypeScript debugging (source maps enabled)
- Application tab for IndexedDB inspection
- React DevTools for component inspection

### Testing Workflow

1. Write unit tests first (TDD approach)
2. Run `pnpm test` to verify unit tests pass
3. Write E2E tests for user flows
4. Run `pnpm test:e2e` to verify E2E tests pass
5. Test manually in browser with `pnpm dev`
6. Verify across different browsers
7. Check mobile device behavior
8. Test with large/complex stories
