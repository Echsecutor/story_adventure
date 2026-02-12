/**
 * Utility functions for constructing LLM prompts for AI story extension.
 */

import type { Story, Section } from '@story-adventure/shared';
import type { MessageContent } from './aiApiClient';

/**
 * System prompt template explaining the LLM's role in story extension.
 */
const SYSTEM_PROMPT = `You are a creative writer extending an interactive branching story adventure.

## Story Structure
The story is a directed graph of sections where each section has:
- A unique ID (string or number)
- Text content (markdown supported via text or text_lines field)
- Optional media (images/videos)
- Choices leading to other sections (the "next" array contains edges in the graph)
- Optional script actions
- Optional ai_gen object with visual description for image generation

## Your Task
You will receive:
1. The story's metadata and character profiles
2. Relevant existing sections (those visited so far + nearby unvisited sections)
3. The section ID to extend from

You must respond with a partial story object containing:
- New sections you're creating
- The extended section with new choices added to its "next" array
- Optional character profiles

Response format (standard Story JSON):

{
  "sections": {
    "extended_section_id": {
      "id": "extended_section_id",
      "text_lines": ["existing text..."],
      "next": [
        {"text": "Existing choice 1", "next": "2"},
        {"text": "Existing choice 2", "next": "3"},
        {"text": "NEW choice 1", "next": "extended_section_id_ext_1"},
        {"text": "NEW choice 2", "next": "extended_section_id_ext_2"}
      ]
    },
    "extended_section_id_ext_1": {
      "id": "extended_section_id_ext_1",
      "text_lines": ["# New Section Title", "", "Story text..."],
      "ai_gen": {
        "prompt": "Detailed visual description for image generation"
      },
      "next": [
        {"text": "Choice text", "next": "extended_section_id_ext_2"}
      ]
    },
    "extended_section_id_ext_2": { ... }
  },
  "meta": {
    "characters": {
      "Character Name": "Detailed character description/profile"
    }
  }
}

## Critical Rules

1. **Output Format**:
   - Respond with ONLY a valid Story JSON object (no markdown fences, no explanations)
   - Use proper JSON syntax with quoted property names
   - The JSON must be parseable

2. **Extended Section**:
   - Include the extended section in your response
   - Keep ALL its existing choices in the "next" array (in the same order)
   - Each choice needs a text. If existing choices no not have text, add a suitable text for that choice.
   - Append your new choices to the end of the "next" array

3. **New Sections**:
   - Create new sections with unique IDs (e.g., "5_ext_1", "5_ext_2", etc.)
   - Each new section should have text content and ideally an "ai_gen.prompt" field
   - Never reuse existing section IDs

4. **Style & Character Consistency**: 
   - Match the existing story's style, tone, and language
   - Use existing character profiles to maintain behavioral consistency
   - Add/update character profiles in meta.characters if needed

5. **Branching Structure**:
   - Create meaningful player choices (usually 2-3 per branch point)
   - Branches may merge back to existing sections
   - Every possible path must form a coherent story

6. **Length Requirements**:
   - Generate at least one complete path of minimum length: 8 sections
   - You may create multiple branching paths

7. **Choice Targets**:
   - All choice targets in "next" arrays must reference valid section IDs
   - Can reference existing sections or newly created sections

## Example Response

{
  "sections": {
    "5": {
      "id": "5",
      "text_lines": ["You stand at a crossroads."],
      "next": [
        {"text": "Go left", "next": "6"},
        {"text": "Enter the library", "next": "5_ext_1"},
        {"text": "Continue down the path", "next": "5_ext_2"}
      ]
    },
    "5_ext_1": {
      "id": "5_ext_1",
      "text_lines": ["# A New Discovery", "", "You stumble upon an ancient library filled with dusty books."],
      "ai_gen": {
        "prompt": "Ancient library interior, dusty bookshelves, warm candlelight, mysterious atmosphere, gothic architecture"
      },
      "next": [
        {"text": "Search the shelves", "next": "5_ext_3"},
        {"text": "Leave quickly", "next": "6"}
      ]
    },
    "5_ext_2": {
      "id": "5_ext_2",
      "text": "The path leads to a garden.",
      "ai_gen": {
        "prompt": "Overgrown garden with stone paths, flowering vines, soft afternoon light"
      },
      "next": [{"text": "Enter garden", "next": "5_ext_4"}]
    },
    "5_ext_3": {
      "id": "5_ext_3",
      "text": "Among the books, you find a leather-bound journal.",
      "ai_gen": {
        "prompt": "Close-up of hands opening old leather journal, yellowed pages, mysterious writing"
      },
      "next": []
    },
    "5_ext_4": {
      "id": "5_ext_4",
      "text": "The garden is serene and peaceful.",
      "next": []
    }
  },
  "meta": {
    "characters": {
      "Librarian": "Elderly keeper of the ancient library, knows its secrets, speaks in riddles"
    }
  }
}`;

/**
 * Extracts relevant sections from the story based on history and look-ahead.
 * Includes: all visited sections (from history) + sections reachable within look-ahead from the extended section.
 *
 * @param story - The full story object
 * @param extendFromSectionId - The section to extend from
 * @param lookAhead - Maximum depth to traverse from the extended section
 * @returns Partial story with only relevant sections
 */
function extractRelevantSections(
  story: Story,
  extendFromSectionId: string,
  lookAhead: number
): { sections: Record<string, Section>; sectionIds: string[] } {
  const relevantSections: Record<string, Section> = {};
  const relevantIds = new Set<string>();

  // Add all sections from history
  const history = story.state?.history || [];
  console.log('[AI Prompt] Including sections from history:', history);
  for (const sectionId of history) {
    if (story.sections[sectionId]) {
      relevantIds.add(sectionId);
      relevantSections[sectionId] = story.sections[sectionId]!;
    }
  }

  // Add sections reachable within look-ahead from the extended section (BFS)
  const queue: Array<{ id: string; depth: number }> = [{ id: extendFromSectionId, depth: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.id) || current.depth > lookAhead) {
      continue;
    }

    visited.add(current.id);
    
    const section = story.sections[current.id];
    if (section) {
      relevantIds.add(current.id);
      relevantSections[current.id] = section;

      // Add choices to queue
      const choices = section.next || [];
      for (const choice of choices) {
        const nextId = choice.next.toString();
        if (!visited.has(nextId)) {
          queue.push({ id: nextId, depth: current.depth + 1 });
        }
      }
    }
  }

  console.log('[AI Prompt] Total relevant sections:', relevantIds.size, Array.from(relevantIds));

  return { sections: relevantSections, sectionIds: Array.from(relevantIds) };
}

/**
 * Strips base64-encoded images from sections to reduce token count.
 *
 * @param sections - The sections object to process
 * @returns A copy of the sections with base64 images replaced by placeholders
 */
function stripBase64Images(sections: Record<string, Section>): Record<string, Section> {
  const sectionsCopy = JSON.parse(JSON.stringify(sections)) as Record<string, Section>;

  for (const sectionId in sectionsCopy) {
    const section = sectionsCopy[sectionId];
    if (section && section.media?.src && section.media.src.startsWith('data:')) {
      // Replace data URLs with a placeholder
      const dataPrefix = section.media.src.substring(0, section.media.src.indexOf(',') + 1);
      section.media.src = dataPrefix + '[embedded image data stripped]';
    }
  }

  return sectionsCopy;
}

/**
 * Builds the user prompt for extending a story from a specific section.
 *
 * @param story - The current story object
 * @param extendFromSectionId - The section ID to extend from
 * @param lookAhead - The ai_gen_look_ahead value (minimum path length multiplier)
 * @returns The constructed user prompt
 */
function buildUserPrompt(
  story: Story,
  extendFromSectionId: string,
  lookAhead: number
): string {
  // Extract only relevant sections (history + look-ahead from extended section)
  const { sections: relevantSections, sectionIds } = extractRelevantSections(
    story,
    extendFromSectionId,
    lookAhead
  );

  // Strip base64 images to save tokens
  const strippedSections = stripBase64Images(relevantSections);

  // Extract metadata and characters
  const storyMeta = story.meta ? {
    title: story.meta.title,
    author: story.meta.author,
    characters: story.meta.characters || {}
  } : { title: 'Untitled Story', characters: {} };

  // Build the prompt
  const prompt = `Extend the story from section "${extendFromSectionId}".

## Story Context

Story metadata and existing character profiles:
${JSON.stringify({ meta: storyMeta }, null, 2)}

Relevant existing sections (visited + nearby):
${JSON.stringify(strippedSections, null, 2)}

## Your Task

1. Include section "${extendFromSectionId}" in your response with ALL its existing choices preserved
2. Add new choices to section "${extendFromSectionId}" (append to the "next" array)
3. Create new sections with unique IDs (format: "${extendFromSectionId}_ext_1", "${extendFromSectionId}_ext_2", etc.)
4. Generate at least one complete story path of minimum length: ${4 * lookAhead} sections

## Response Format

Return a partial Story JSON object:
{
  "sections": {
    "${extendFromSectionId}": { ... with existing + new choices ... },
    "${extendFromSectionId}_ext_1": { ... new section ... },
    "${extendFromSectionId}_ext_2": { ... new section ... }
  },
  "meta": {
    "characters": { ... optional character profiles ... }
  }
}

## Important

- Do NOT include markdown code fences
- Do NOT include explanatory text
- Respond with ONLY valid Story JSON
- Keep ALL existing choices in section "${extendFromSectionId}" and append new ones
- All choice targets must reference valid section IDs (existing: ${sectionIds.join(', ')}, or newly created)
- Ideally add "ai_gen.prompt" to each new section for image generation`;

  return prompt;
}

/**
 * Constructs the complete messages array for the LLM API request.
 *
 * @param story - The current story object
 * @param extendFromSectionId - The section ID to extend from
 * @param lookAhead - The ai_gen_look_ahead value
 * @returns Array of message objects for the API request
 */
export function buildPromptMessages(
  story: Story,
  extendFromSectionId: string,
  lookAhead: number
): Array<{ role: string; content: MessageContent }> {
  const userPrompt = buildUserPrompt(story, extendFromSectionId, lookAhead);

  console.debug('[AI Prompt] System prompt:', SYSTEM_PROMPT);
  console.debug('[AI Prompt] User prompt:', userPrompt);

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];
}
