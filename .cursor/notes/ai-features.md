# AI Story Extension Features

## Overview

The viewer supports optional AI-powered story extension, allowing stories to be dynamically expanded using LLM-based generation when the player approaches sections marked as `ai_extendable`.

## Story Persistence

Since AI expansion modifies the story structure dynamically (adding new sections and choices), the viewer now persists the **complete story** (not just state) to browser IndexedDB:

- **Key**: `'current_viewer_story'` in IndexedDB
- **Auto-save**: Triggers 1 second after story changes (debounced)
- **Auto-restore**: On mount, if no `?load=` URL parameter is present, restores saved story from IndexedDB
- **Save/Load Progress**: Now saves/loads entire story structure, not just current state
- **Implementation**: Uses same `get_story()`/`save_story()` from `@story-adventure/shared` as editor

This ensures AI-generated content persists across browser sessions and can be saved/loaded as complete story files.

## OpenAI Chat Completions API Format

### Configuration Storage

**IMPORTANT**: LLM endpoint configuration is stored in **browser localStorage**, NOT in story files. This ensures API keys and credentials are never shared with stories.

Users configure the LLM endpoint through the viewer's menu screen:

- **URL**: e.g., `https://api.openai.com/v1/chat/completions`
- **API Key**: e.g., `sk-...` (stored securely in browser only)
- **Type**: `openai` or `custom`
- **Model**: e.g., `gpt-4o` (optional)

Configuration is persisted to `localStorage` key: `llm_endpoint_config`

### Request Body

The API supports both text-only and multimodal (image + text) messages:

**Text-only format:**
```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "System prompt..." },
    { "role": "user", "content": "User prompt with story JSON..." }
  ],
  "stream": true
}
```

**Multimodal format (for vision models):**
```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "System prompt..." },
    { 
      "role": "user", 
      "content": [
        { "type": "text", "text": "Describe this image:" },
        { "type": "image_url", "image_url": { "url": "https://..." } }
      ]
    }
  ],
  "stream": true
}
```

Image URLs can be:
- Public HTTP/HTTPS URLs
- Data URIs (base64-encoded): `data:image/jpeg;base64,...`
- Cloud storage URLs (e.g., `gs://...` for Gemini on Vertex AI)

### HTTP Headers

```
Content-Type: application/json
Authorization: Bearer <api_key>
```

### Streaming Response Format

Responses are Server-Sent Events (SSE) with format:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"text"}}]}

data: [DONE]
```

### Browser Streaming Implementation

```typescript
const response = await fetch(endpoint.url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify({ model, messages, stream: true })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let fullContent = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk
    .split("\n")
    .filter(line => line.startsWith("data: "))
    .map(line => line.replace("data: ", ""));
  
  for (const line of lines) {
    if (line === "[DONE]") break;
    const parsed = JSON.parse(line);
    const content = parsed.choices?.[0]?.delta?.content;
    if (content) fullContent += content;
  }
}
```

## LLM Prompting Strategy for Story Generation

### Response Format

The LLM returns a **partial Story object** using the standard story format:

```typescript
{
  sections: {
    "extended_section_id": {  // The section being extended
      id: "extended_section_id",
      text_lines: [...],
      next: [
        ...existing_choices,  // Original choices preserved
        ...new_choices        // New choices appended
      ]
    },
    "extended_section_id_ext_1": {  // New sections
      id: "extended_section_id_ext_1",
      text_lines: [...],
      ai_gen: { prompt: "..." },
      next: [...]
    },
    // ... more new sections
  },
  meta: {
    characters: {  // Optional character updates
      "CharacterName": "description"
    }
  }
}
```

This approach:
- Uses standard Story format (no artificial structures)
- Reduces LLM confusion (familiar format)
- Extended section shows explicit relationship (source + edges)
- Reduces token usage (only returns new/modified sections)
- Improves JSON generation reliability (simpler, familiar structure)

### System Prompt Design

The system prompt:

1. **Defines the response format clearly**: Shows exact JSON structure with examples

2. **Explains the task**: Extend story by creating new sections and choices

3. **Emphasizes JSON validity**: 
   - No markdown code fences
   - Proper quoted property names
   - Valid parseable JSON

4. **Visual content requirement**: Every new section MUST have `ai_gen.prompt`

5. **Style & character consistency**: 
   - Match existing story style and tone
   - Use existing character profiles
   - Add/update characters in response

6. **Structural requirements**:
   - Multiple choices create meaningful player agency
   - Minimum path length: 4 × `ai_gen_look_ahead` sections
   - Branches may merge to existing sections
   - All paths must be coherent

7. **ID generation**: Clear format (e.g., "5_ext_1", "5_ext_2")

### Context Optimization

Instead of sending the complete story, only send:

1. **Story metadata**: Title, author, existing character profiles
2. **Relevant sections**: 
   - All visited sections (from `story.state.history`)
   - Sections reachable within `ai_gen_look_ahead` steps from the extended section
   - Uses BFS traversal to find reachable sections

This dramatically reduces token usage while maintaining necessary context.

### User Prompt Structure

Dynamic per-request:

- Section ID to extend from
- Story metadata and character profiles
- Relevant existing sections only (not entire story)
- List of existing section IDs for reference validation
- `ai_gen_look_ahead` value
- Minimum path length requirement (4 × look_ahead)
- Expected response format reminder

### Key Design Principles

From research (TaleFrame, STORY2GAME, what-if systems):

- **Structured Information Decomposition**: Request specific fields (sections, choices, characters) separately
- **Context Minimization**: Send only necessary sections to reduce token usage and improve reliability
- **Meta-Prompting with Context**: Reference existing characters and story style for coherence
- **Clear Format Specification**: Provide exact JSON structure and examples to reduce generation errors
- **Constraint vs Flexibility Balance**: Define boundaries through structured format while preserving creative flexibility

## AI Extension Data Model

### Story Metadata Extensions

```typescript
interface StoryMeta {
  // ... existing fields ...
  ai_gen_look_ahead?: number; // Default: 2
  characters?: Record<string, string>; // name -> description
}
```

**Note**: `llm_endpoint` is NOT stored in story files. It's stored in browser localStorage for security.

### Section Extensions

```typescript
interface Section {
  // ... existing fields ...
  ai_extendable?: boolean; // Default: false
  ai_gen?: AiGenImage;
}

interface AiGenImage {
  prompt: string; // Image generation prompt
  negative_prompt?: string;
  size?: string;
}
```

## Look-Ahead Algorithm

1. When player reaches section S:
2. Perform BFS/DFS from S up to `ai_gen_look_ahead` steps
3. If any reachable section has `ai_extendable === true`:
   - Check if already extended or in-progress (avoid duplicates)
   - Trigger AI extension flow
4. Extension flow:
   - Build system + user prompts
   - Stream LLM response
   - Validate response (no deletions, valid graph)
   - Apply updates to story
   - Show toast notification

## Editor Support

- **AI Extendable toggle**: `SectionPanel.tsx` has a toggle switch (`Form.Check type="switch"`) under a bold "AI Extension" label to toggle `ai_extendable` on sections, with a `title` attribute tooltip and `Form.Text` help text below
- **Important**: Toggle uses local `aiExtendable` state (like `text` and `mediaSrc`) for immediate UI feedback, since `selectedNode` is a stale snapshot that doesn't update until re-selected
- **Note**: Do NOT use `OverlayTrigger`/`Tooltip` from react-bootstrap -- they cause silent render failures with React 19 due to ref forwarding incompatibility. Use native `title` attributes or `Form.Text` for help text instead.
- Unchecking sets `ai_extendable` to `undefined` (omitted from JSON) rather than `false`

## User Consent & Privacy

- AI generation is **opt-in** with explicit consent dialog
- **LLM credentials stored in browser only** - never in story files for security
- Users configure their own LLM endpoint (URL, API key) through settings menu
- Configuration persisted in browser localStorage only
- Warning shown: "Your configured LLM endpoint will be called to generate text/images"
- User preference (enabled/disabled) stored in browser localStorage
- `aiExpansionEnabled` state in `App.tsx` initializes from localStorage via `getAiExpansionConsent()`
- Toggle available on menu screen
- No story data sent unless explicitly enabled
- Stories only contain `ai_extendable` flags and `ai_gen` prompts - no credentials

## Testing AI Communication

The viewer's AI Story Expansion Settings includes a "Test AI Communication" button:

- Sends simple test message: "Communication test: say hello and return immediately."
- System prompt: "You are a helpful AI assistant."
- Shows spinner during test (30-second timeout)
- Displays success/fail badge after test completes
- Status resets when settings are changed
- Implementation in `MenuScreen.tsx` using `callLlmStreaming()` from `aiApiClient.ts`

## Image Prompt Generation (Reverse Engineering)

The viewer includes image information accessible via the settings modal (gear icon ⚙ in lower left corner):

### Features

- **Display AI Generation Metadata**: Shows `ai_gen` fields (prompt, negative_prompt, size) if available in "Image Information" section
- **Generate Image Prompt**: Uses vision-capable LLM to reverse-engineer the image into an image generation prompt
- **Prompt Engineering**: AI analyzes visual style, composition, lighting, colors, mood, subject details, and artistic techniques
- **Save to Section**: Generated prompts can be saved to the section's `ai_gen.prompt` field
- **Persistence**: Saved prompts are included in the story structure and persist through save/load operations
- **Multimodal API Support**: Sends image + text prompt using chat/completions format

### Implementation

- **Modal**: `SettingsModal.tsx` - displays metadata in "Image Information" accordion section, provides "Generate Image Prompt" button, and "Save to Section" functionality
- **API Client**: `aiImageDescription.ts` - handles multimodal API calls for image prompt generation
- **Button**: Settings button (⚙) always visible in lower left corner during playback
- **Story Update**: Generated prompts are saved via callback that updates the story structure and triggers auto-save to IndexedDB
- **UI Feedback**: Shows "✓ Saved" badge after saving prompt to section
- **Vision Models Supported**: GPT-4o, GPT-4-turbo, Claude 3+, Gemini 2.0+/2.5+, Grok-2-vision

### Prompt Strategy

The system instructs the AI to:
- Analyze the image comprehensively
- Generate a detailed image generation prompt that could recreate the image
- Focus on visual style, composition, lighting, colors, mood, subject details, and artistic techniques
- Format the prompt as if instructing an AI image generator (DALL-E, Stable Diffusion, Midjourney, etc.)
- Return ONLY the raw prompt text without any headers, labels, markdown formatting, or explanatory text

### Message Format

The image prompt generation request uses multimodal content:

```typescript
{
  role: 'system',
  content: 'You are an expert at analyzing images and creating detailed image generation prompts. ' +
           'Your task is to reverse-engineer images into prompts that could recreate them. ' +
           'Always respond with ONLY the raw prompt text - no formatting, no labels, no explanations.'
},
{
  role: 'user',
  content: [
    { 
      type: 'text', 
      text: 'Analyze this image and generate a detailed image generation prompt that would recreate it. ' +
            'Focus on: visual style, composition, lighting, colors, mood, subject details, and artistic techniques. ' +
            'Write the prompt as if instructing an AI image generator like DALL-E, Stable Diffusion, or Midjourney. ' +
            'IMPORTANT: Return ONLY the raw prompt text itself. Do NOT include any headers, labels, markdown formatting, ' +
            'code fences, or words like "Prompt:", "Here is", etc. Just the plain prompt text.'
    },
    { type: 'image_url', image_url: { url: imageUrl } }
  ]
}
```

The `aiApiClient.ts` supports both string and array content types via the `MessageContent` type. This ensures the AI returns clean, usable prompt text without any formatting artifacts.

## AI Image Generation

The viewer supports AI-powered image generation for sections with `ai_gen.prompt` fields.

### Configuration

**Storage**: Image generation settings are stored in browser localStorage (separate from LLM endpoint config):
- **Key**: `ai_image_generation_config` - stores endpoint configuration
- **Key**: `ai_image_generation_enabled` - stores enabled/disabled state
- Configuration includes: URL, API key (optional), model (optional)

**Interface**: Settings accessible via "AI Image Generation Settings" section in settings modal

### API Format

Uses OpenAI-compatible `/v1/images/generations` endpoint (not chat completions):

**Request**:
```json
{
  "prompt": "text description of desired image",
  "n": 1,
  "size": "1024x1024",
  "response_format": "b64_json",
  "model": "dall-e-3"  // optional
}
```

**Response**:
```json
{
  "data": [
    {
      "b64_json": "iVBORw0KGgoAAAANS..."
    }
  ]
}
```

### Features

1. **Auto-generate Button**: When image generation is enabled and section has `ai_gen.prompt` but no `media`, a "Generate Image" button appears in the story container
2. **Regenerate Button**: In Image Information section of settings modal, "(Re)generate Image" button available when section has `ai_gen` metadata
3. **Base64 Storage**: Generated images saved as data URLs in section's `media.src` field (`data:image/png;base64,...`)
4. **Auto-save**: Story automatically saved to IndexedDB after successful image generation
5. **Size Support**: Respects `ai_gen.size` field from section metadata (defaults to "1024x1024")

### Implementation

- **API Client**: `aiImageGeneration.ts` - handles image generation API calls with base64 response
- **Settings UI**: `SettingsModal.tsx` - configuration and regenerate button
- **Story Button**: `App.tsx` - conditional "Generate Image" button in story container
- **State Management**: `App.tsx` - `handleGenerateImage()` callback updates story structure
- **Preferences**: `aiPreferences.ts` - localStorage functions for config and enabled state

### Supported Models

Any OpenAI-compatible image generation endpoint:
- DALL-E 2/3 (OpenAI)
- Gemini image models (gemini-2.5-flash-image, gemini-3-pro-image-preview)
- Custom endpoints following the same API format

### User Experience

- Enable/disable toggle in settings (default: disabled)
- Button only appears when conditions are met (enabled + prompt exists + no image)
- Loading spinner during generation (60-second timeout)
- Toast notifications for success/failure
- Generated images persist through save/load

## Validation and Merging

### New Architecture

The validator now processes partial Story responses in the standard format. This simplifies validation and uses the familiar story data model.

### Validation Rules

The validator performs these checks on the partial story:

1. **JSON validity**: Response must be valid JSON (handles markdown code fences)
2. **Structure validation**: Must have `sections` object
3. **Content requirement**: Must have at least some new sections or include the extended section
4. **New section structure**: Each new section must have:
   - Matching `id` field
   - Either `text` or `text_lines` field
   - Ideally an `ai_gen.prompt` field (warning if missing, not an error)
5. **Reference validation**: All choice targets in all sections must reference valid section IDs (existing or newly created)
6. **Graph integrity**: Validate all edges point to existing nodes

### Merging Algorithm

The merging process:

1. **Start with original**: Deep copy of the original story (preserves all existing data)
2. **Identify new sections**: Find sections in response that don't exist in original
3. **Add new sections**: Copy all truly new sections to merged story
4. **Merge extended section choices**: 
   - If response includes the extended section
   - Build maps of choices by their `next` property (target section ID)
   - For each choice in the AI response:
     - If it targets an existing choice's section, merge text if AI added text
     - If it targets a new section, add as a new choice
   - Choices are identified by their `next` property, not by position or text
   - This allows AI to add text to existing choices without creating duplicates
5. **Mark as extended**: Set `ai_extendable = false` on the extended section to prevent re-expansion
6. **Merge characters**: Merge `meta.characters` into story (preserving existing)
7. **Final validation**: Verify graph integrity of merged story

### Key Improvements

- **Standard format**: Uses familiar Story structure, no artificial data models
- **No media comparison needed**: Since LLM doesn't return existing sections (except extended), media preservation is automatic
- **Simpler for LLM**: Familiar structure reduces generation errors
- **Flexible validation**: Warnings for missing `ai_gen.prompt` instead of hard failures
- **Explicit edge source**: Extended section in response shows where new edges come from
- **Atomic merging**: Clear separation between original content (preserved) and new content (added)

## Error Handling and Debugging

### Error Types

- HTTP errors (non-2xx responses)
- Network failures
- Invalid JSON in LLM response
- Validation failures
- Timeout (AbortController)
- All errors result in toast notifications with diagnostic info

### Comprehensive Logging

The AI expansion system includes detailed console logging for debugging:

**In `useAiExpansion.ts`:**
- Complete LLM response logged before validation
- Response length tracked
- Extension triggers and section IDs logged

**In `aiPromptBuilder.ts`:**
- Section extraction logged (history sections and look-ahead sections)
- Total relevant section count logged
- Section IDs included in prompt logged

**In `aiValidator.ts`:**
- Each validation step logged with step number and description
- Extension structure logged (new section count, new choice count)
- JSON extraction progress logged (with first 500 chars on parse errors)
- Validation checks logged:
  - Structure validation (new_sections, new_choices)
  - Required field validation (id, text, ai_gen.prompt)
  - Reference validation (all targets exist)
  - Duplicate ID detection
- Merge process logged:
  - Sections added
  - Choices added to extended section
  - Characters merged
- Final section count logged
- Graph integrity validation logged

All logs use `[AI Expansion]`, `[AI Prompt]`, or `[Validator]` prefixes for easy filtering.
