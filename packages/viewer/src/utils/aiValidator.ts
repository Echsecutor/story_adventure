/**
 * Validation utilities for AI-generated story updates.
 */

import type { Story, Section } from '@story-adventure/shared';

/**
 * Result of story validation.
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Validated and parsed story if successful */
  story?: Story;
}

/**
 * Extracts JSON from LLM response, handling potential markdown code fences.
 *
 * @param responseText - Raw text response from the LLM
 * @returns Parsed JSON object or throws on parse error
 */
function extractJSON(responseText: string): unknown {
  let jsonText = responseText.trim();

  // Remove markdown code fences if present
  const codeBlockMatch = jsonText.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    jsonText = codeBlockMatch[1].trim();
  }

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validates that a section has identical content (deep comparison).
 *
 * @param original - Original section
 * @param updated - Updated section
 * @returns true if sections are identical
 */
function sectionsAreIdentical(original: Section, updated: Section): boolean {
  // Compare all fields except ai_extendable and ai_gen (those can be added)
  // and next (choices can be added)

  // ID must match
  if (original.id !== updated.id) return false;

  // Text must match (either text or text_lines)
  if (original.text !== updated.text) return false;
  if (JSON.stringify(original.text_lines) !== JSON.stringify(updated.text_lines))
    return false;

  // Media must match
  if (JSON.stringify(original.media) !== JSON.stringify(updated.media)) return false;

  // Script must match
  if (JSON.stringify(original.script) !== JSON.stringify(updated.script)) return false;

  // For choices, the original choices must all still exist
  // (but new choices can be added)
  const originalChoices = original.next || [];
  const updatedChoices = updated.next || [];

  if (originalChoices.length > updatedChoices.length) {
    return false; // Choices were removed
  }

  // Check that all original choices still exist in the same order at the start
  for (let i = 0; i < originalChoices.length; i++) {
    const origChoice = originalChoices[i];
    const updChoice = updatedChoices[i];
    if (
      origChoice?.text !== updChoice?.text ||
      origChoice?.next !== updChoice?.next
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Validates that all references in next choices point to valid section IDs.
 *
 * @param story - The story to validate
 * @returns true if all references are valid
 */
function validateGraphIntegrity(story: Story): boolean {
  for (const sectionId in story.sections) {
    const section = story.sections[sectionId];
    if (!section) continue;
    
    const choices = section.next || [];

    for (const choice of choices) {
      const targetId = choice.next.toString();
      if (!story.sections[targetId]) {
        console.error(
          `[Validator] Invalid reference: Section ${sectionId} has choice pointing to non-existent section ${targetId}`
        );
        return false;
      }
    }
  }
  return true;
}

/**
 * Validates an AI-generated story update.
 *
 * @param originalStory - The original story before AI extension
 * @param llmResponse - Raw text response from the LLM
 * @param extendedSectionId - The section ID that should have been extended
 * @returns Validation result with parsed story if valid
 */
export function validateAiStoryUpdate(
  originalStory: Story,
  llmResponse: string,
  extendedSectionId: string
): ValidationResult {
  try {
    // Step 1: Extract and parse JSON
    const parsed = extractJSON(llmResponse);

    if (!parsed || typeof parsed !== 'object') {
      return {
        valid: false,
        error: 'LLM response is not a valid JSON object',
      };
    }

    const updatedStory = parsed as Story;

    // Step 2: Validate story structure
    if (!updatedStory.sections || typeof updatedStory.sections !== 'object') {
      return {
        valid: false,
        error: 'Updated story is missing sections object',
      };
    }

    // Step 3: Check that no sections were deleted
    const originalSectionIds = Object.keys(originalStory.sections);
    const updatedSectionIds = Object.keys(updatedStory.sections);

    for (const originalId of originalSectionIds) {
      if (!updatedStory.sections[originalId]) {
        return {
          valid: false,
          error: `Section ${originalId} was deleted from the story`,
        };
      }
    }

    // Step 4: Validate that existing sections were not modified
    for (const originalId of originalSectionIds) {
      const original = originalStory.sections[originalId];
      const updated = updatedStory.sections[originalId];

      if (!original || !updated) {
        return {
          valid: false,
          error: `Section ${originalId} is missing in validation`,
        };
      }

      if (!sectionsAreIdentical(original, updated)) {
        return {
          valid: false,
          error: `Section ${originalId} was modified (only additions are allowed)`,
        };
      }
    }

    // Step 5: Check that the extended section has new choices
    const originalExtendedSection = originalStory.sections[extendedSectionId];
    const updatedExtendedSection = updatedStory.sections[extendedSectionId];

    if (!originalExtendedSection || !updatedExtendedSection) {
      return {
        valid: false,
        error: `Extended section ${extendedSectionId} not found`,
      };
    }

    const originalChoiceCount = originalExtendedSection.next?.length || 0;
    const updatedChoiceCount = updatedExtendedSection.next?.length || 0;

    if (updatedChoiceCount <= originalChoiceCount) {
      return {
        valid: false,
        error: `Section ${extendedSectionId} was not extended with new choices`,
      };
    }

    // Step 6: Validate graph integrity (all references point to valid sections)
    if (!validateGraphIntegrity(updatedStory)) {
      return {
        valid: false,
        error: 'Story graph has invalid section references',
      };
    }

    // Step 7: Count new sections added
    const newSectionCount = updatedSectionIds.length - originalSectionIds.length;
    console.log(
      `[Validator] Validation passed: ${newSectionCount} new sections added, ${updatedChoiceCount - originalChoiceCount} new choices added to section ${extendedSectionId}`
    );

    return {
      valid: true,
      story: updatedStory,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
