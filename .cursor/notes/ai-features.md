# AI Story Extension Features

## Overview

The viewer supports optional AI-powered story extension, allowing stories to be dynamically expanded using LLM-based generation when the player approaches sections marked as `ai_extendable`.

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

### System Prompt Design

Based on research into branching narrative generation (TaleFrame, STORY2GAME, what-if systems), the system prompt should:

1. **Define the LLM's role clearly**: "You are a creative writer extending an interactive branching story adventure."

2. **Explain the data structure**: Story is a directed graph where sections have text, media, and choices leading to other sections.

3. **Style consistency**: "Follow the general style, tone, and language of the existing story."

4. **Character consistency**: 
   - Analyze existing characters
   - Use `meta.characters` if present for character profiles
   - Create character profiles if missing to ensure behavioral consistency

5. **Structural requirements**:
   - Multiple choices create meaningful player agency
   - Each new section needs `ai_gen` image prompt for visual consistency
   - Minimum path length: 4 × `ai_gen_look_ahead` sections
   - Branches may merge but all linearizations must be coherent

6. **Output format**: "Your response must contain ONLY the updated story JSON with all existing sections preserved and new sections added."

### User Prompt Structure

Dynamic per-request:

- Section ID to extend from
- Full current story JSON (with base64 images stripped/truncated)
- `ai_gen_look_ahead` value
- Explicit constraint: "Do not delete or modify existing sections. Only add new sections and choices."

### Key Design Principles

From research (TaleFrame, STORY2GAME, what-if papers):

- **Structured Information Decomposition**: Breaking story into entities, events, relationships, and outline enables fine-grained control
- **Meta-Prompting with Context**: Referencing major plot points and character goals maintains narrative coherence across branches
- **Action-Centric with Preconditions**: Generating actions with explicit state requirements maintains logical story progression
- **Constraint vs Flexibility Balance**: Define boundaries through structured frameworks while preserving creative flexibility

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

## Validation Rules

Before applying LLM-generated story updates:

1. **No deletions**: All existing section IDs must remain with identical content
2. **Valid extensions**: Specified `ai_extendable` section must have new choices added
3. **Graph integrity**: All `next` references must point to valid section IDs
4. **JSON validity**: Response must be valid JSON story format
5. **Character consistency**: If LLM adds characters, merge into `meta.characters`

## Error Handling

- HTTP errors (non-2xx responses)
- Network failures
- Invalid JSON in LLM response
- Validation failures
- Timeout (AbortController)
- All errors result in toast notifications with diagnostic info
