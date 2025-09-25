# Story Format Specification

## JSON Structure Overview

Story Adventure files are JSON documents with the following top-level structure:

```json
{
  "meta": {
    /* Story metadata */
  },
  "state": {
    /* Current game state */
  },
  "sections": {
    /* Story content */
  },
  "variables": {
    /* Variable definitions */
  }
}
```

## Meta Section

Contains story metadata and authoring information:

```json
"meta": {
  "title": "Story Title",
  "author": {
    "name": "Author Name",
    "url": "https://github.com/username"
  },
  "year": "2024",
  "license": {
    "name": "CC BY-SA 4.0",
    "url": "https://creativecommons.org/licenses/by-sa/4.0/"
  }
}
```

## State Section

Manages current game state and player progress:

```json
"state": {
  "current_section": "1",
  "variables": {
    "player_name": "Default",
    "score": 0
  },
  "history": ["1", "2", "3"]
}
```

## Sections

Core story content organized by unique section IDs:

```json
"sections": {
  "1": {
    "id": "1",
    "text_lines": ["# Section Title", "", "Story text with ${variable} interpolation"],
    "next": [
      {"text": "Choice description", "next": "2"},
      {"text": "Another choice", "next": "3"}
    ],
    "media": {
      "type": "image",
      "src": "path/to/image.png"
    },
    "script": [
      {"action": "SET", "parameters": ["variable_name", "value"]}
    ]
  }
}
```

### Section Properties

- **`id`** - Unique identifier (string)
- **`text_lines`** - Array of text lines supporting Markdown
- **`next`** - Array of choice objects for navigation
- **`media`** - Optional media object (image/video)
- **`script`** - Optional array of action objects

### Choice Objects

```json
{
  "text": "Choice display text",
  "next": "target_section_id"
}
```

- Empty `text` creates invisible "continue" button
- Multiple choices create decision points
- `next` can be string or number (section ID)

### Media Objects

```json
{
  "type": "image", // or "video"
  "src": "path/to/file.ext" // or data URL for embedded
}
```

Supports:

- External file references (relative paths)
- Embedded data URLs (base64 encoded)
- Image formats: PNG, JPG, GIF, WebP
- Video formats: MP4, WebM

## Variable System

Variables enable dynamic content and state tracking:

### Variable Declaration

```json
"variables": {
  "player_name": {
    "default": "Hero",
    "description": "The player's chosen name"
  }
}
```

### Variable Interpolation

Use `${variable_name}` in text_lines for dynamic content:

```json
"text_lines": ["Hello, ${player_name}!", "Your score is ${score}."]
```

## Action System

Actions provide interactivity and logic flow:

### Available Actions

#### INPUT

Prompts user for variable input:

```json
{ "action": "INPUT", "parameters": ["variable_name", "Prompt text"] }
```

#### SET

Assigns value to variable:

```json
{ "action": "SET", "parameters": ["variable_name", "new_value"] }
```

#### ADD_TO_VARIABLE

Appends to existing variable:

```json
{
  "action": "ADD_TO_VARIABLE",
  "parameters": ["variable_name", "additional_text"]
}
```

#### COMPARE_DO

Conditional logic execution:

```json
{
  "action": "COMPARE_DO",
  "parameters": ["variable_name", "=", "expected_value", "next_action"]
}
```

Supported operators: `=`, `!=`, `>`, `>=`, `<=`, `<`

### Action Execution

Actions execute in sequence when entering a section:

1. Before displaying section content
2. In order defined in `script` array
3. Can modify variables affecting text interpolation

## Best Practices

### File Organization

- Use descriptive section IDs
- Keep media files in same directory as story JSON
- Use relative paths for portability

### Content Structure

- Start with section "1" as entry point
- Use Markdown for text formatting
- Keep choices concise and clear
- Test all paths for completeness

### Variable Management

- Initialize all variables in `variables` section
- Use meaningful variable names
- Document variable purposes
- Test interpolation in all contexts

### Media Guidelines

- Optimize images for web (reasonable file sizes)
- Consider embedded vs. external based on distribution needs
- Provide alt text context in story text
- Test media loading in both editor and viewer
