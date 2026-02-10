/**
 * Utility functions for constructing LLM prompts for AI story extension.
 */

import type { Story } from '@story-adventure/shared';

/**
 * System prompt template explaining the LLM's role in story extension.
 */
const SYSTEM_PROMPT = `You are a creative writer extending an interactive branching story adventure.

The story is a directed graph of sections. Each section has:
- A unique ID
- Text content (markdown supported)
- Optional media (images/videos)
- Choices leading to other sections (edges in the graph)
- Optional script actions that execute when entering the section

Your task is to extend the story by adding new sections and choices. Follow these rules:

1. **Style Consistency**: Follow the general style, tone, and language of the existing story. Match the narrative voice and formatting.

2. **Character Consistency**: 
   - If meta.characters exists, use those character profiles to maintain behavioral consistency
   - If meta.characters does not exist, create it with key-value pairs (character name -> description)
   - Ensure recurring characters behave consistently across all paths

3. **Branching Structure**:
   - Add multiple choices/edges from sections to give readers meaningful decisions
   - Branches may merge with each other or with existing story sections
   - Every possible path through the graph (every linearization) must form a coherent storyline

4. **Visual Content**:
   - For each new section, include an "ai_gen" object with a "prompt" field
   - The prompt should describe the scene visually so an image-generating AI can produce an illustration
   - Be specific about visual details, mood, lighting, and composition

5. **Length Requirements**:
   - Generate at least one complete story path of minimum length 4 × ai_gen_look_ahead sections
   - You may create multiple branching paths that later merge

6. **Preservation**:
   - DO NOT delete or modify any existing sections
   - DO NOT change existing section IDs, text_lines, media, or script
   - ONLY add new sections and add new choices to the specified ai_extendable section

7. **Output Format**:
   - Your response must contain ONLY the complete updated story JSON
   - Include all existing sections plus your new additions
   - Do not include markdown code fences or explanatory text
   - The JSON must be valid and parseable

Example of a new section with ai_gen:
{
  "id": "new_section_123",
  "text_lines": ["# A New Discovery", "", "You stumble upon an ancient library..."],
  "ai_gen": {
    "prompt": "An ancient library filled with dusty books, warm candlelight, mysterious atmosphere, gothic architecture"
  },
  "next": [
    {"text": "Search the shelves", "next": "new_section_124"},
    {"text": "Leave the library", "next": "7"}
  ]
}`;

/**
 * Strips base64-encoded images from a story JSON to reduce token count.
 *
 * @param story - The story object to process
 * @returns A copy of the story with base64 images replaced by placeholders
 */
function stripBase64Images(story: Story): Story {
  const storyCopy = JSON.parse(JSON.stringify(story)) as Story;

  for (const sectionId in storyCopy.sections) {
    const section = storyCopy.sections[sectionId];
    if (section && section.media?.src && section.media.src.startsWith('data:')) {
      // Replace data URLs with a placeholder
      const dataPrefix = section.media.src.substring(0, section.media.src.indexOf(',') + 1);
      section.media.src = dataPrefix + '[embedded image data stripped]';
    }
  }

  return storyCopy;
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
  // Strip base64 images to save tokens
  const strippedStory = stripBase64Images(story);

  // Build the prompt
  const prompt = `Extend the following story from section "${extendFromSectionId}".

ai_gen_look_ahead value: ${lookAhead}
(This means you should generate at least one path of length ${4 * lookAhead} sections)

Current story JSON:
${JSON.stringify(strippedStory, null, 2)}

Remember:
- Do NOT delete or modify existing sections
- Add new choices to section "${extendFromSectionId}"
- Generate new sections with unique IDs (suggest using ID format like "${extendFromSectionId}_ext_1", "${extendFromSectionId}_ext_2", etc.)
- Each new section must have an "ai_gen" object with a visual "prompt"
- If meta.characters doesn't exist, create it
- Respond with ONLY the complete updated story JSON (no markdown fences, no explanations)`;

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
): Array<{ role: string; content: string }> {
  const userPrompt = buildUserPrompt(story, extendFromSectionId, lookAhead);

  console.debug('[AI Prompt] System prompt:', SYSTEM_PROMPT);
  console.debug('[AI Prompt] User prompt:', userPrompt);

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];
}
