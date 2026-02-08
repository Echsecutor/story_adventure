# @story-adventure/shared

Shared types, utilities, and action system for Story Adventure.

## Overview

This package contains the core logic and type definitions used by both the Story Adventure editor and viewer. It includes:

- **Type definitions** (`types.ts`) - TypeScript interfaces for Story, Section, Choice, Action, etc.
- **Action system** (`actions.ts`) - Execution engine for story actions (SET, IF_SET_DO, ADD_CHOICE, etc.)
- **Utilities** (`utils.ts`) - Helper functions for text extraction and file naming
- **Variable interpolation** (`variables.ts`) - Variable replacement in text (${variable} syntax)
- **Storage** (`storage.ts`) - IndexedDB utilities for saving/loading stories

## Installation

```bash
pnpm add @story-adventure/shared
```

## Usage

### Types

```typescript
import type { Story, Section, Action } from '@story-adventure/shared';

const story: Story = {
  sections: {
    '1': {
      id: '1',
      text_lines: ['Hello ${name}!'],
      next: [{ text: 'Continue', next: '2' }],
    },
  },
  state: {
    variables: { name: 'Alice' },
  },
};
```

### Actions

```typescript
import { execute_actions, supported_actions } from '@story-adventure/shared';

// Execute actions from a section's script
execute_actions(story, [
  { action: 'SET', parameters: ['score', '100'] },
  { action: 'ADD_CHOICE', parameters: ['2', 'Go to section 2'] },
]);
```

### Variable Interpolation

```typescript
import { replace_variables } from '@story-adventure/shared';

const text = replace_variables('Hello ${name}', { name: 'Alice' });
// Returns: "Hello Alice"
```

### Utilities

```typescript
import { get_text_from_section, get_file_safe_title } from '@story-adventure/shared';

const text = get_text_from_section(section, story.state?.variables);
const filename = get_file_safe_title(story);
```

## Action Types

The action system supports the following action types:

- **SET** - Set a variable to a value
- **INPUT** - Prompt user for variable input
- **ADD_TO_VARIABLE** - Add numeric value to variable
- **COMPARE_DO** - Conditional execution based on comparison
- **IF_SET_DO** - Execute action if variable is set
- **IF_NOT_SET_DO** - Execute action if variable is not set
- **ADD_CHOICE** - Add a choice to current section
- **REMOVE_CHOICE** - Remove a choice from current section
- **IF_SET_ADD_CHOICE** - Conditionally add choice
- **IF_SET_REMOVE_CHOICE** - Conditionally remove choice

See the [Story Format documentation](../../.cursor/notes/story-format.md) for detailed action specifications.

## Testing

Run tests with:

```bash
pnpm test
```

## License

See root LICENSE file.
