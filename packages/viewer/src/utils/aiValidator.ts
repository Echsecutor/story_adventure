/**
 * Validation utilities for AI-generated story updates.
 */

import type { Story } from '@story-adventure/shared';

/**
 * Result of story validation and merging.
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Merged story with original data preserved and new content added */
  story?: Story;
}

/**
 * Extracts JSON from LLM response, handling potential markdown code fences.
 *
 * @param responseText - Raw text response from the LLM
 * @returns Parsed JSON object or throws on parse error
 */
function extractJSON(responseText: string): unknown {
  console.log('[Validator] Extracting JSON from response (length:', responseText.length, ')');
  let jsonText = responseText.trim();

  // Remove markdown code fences if present
  const codeBlockMatch = jsonText.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    console.log('[Validator] Removed markdown code fences from response');
    jsonText = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonText);
    console.log('[Validator] JSON parsed successfully');
    return parsed;
  } catch (error) {
    console.error('[Validator] JSON parse error:', error);
    console.error('[Validator] Failed to parse text (first 500 chars):', jsonText.substring(0, 500));
    throw new Error(
      `Failed to parse JSON from LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
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
 * Merges AI-generated partial story with original, preserving all original data and only adding new content.
 *
 * @param originalStory - The original story before AI extension
 * @param partialStory - The AI-generated partial story (new sections + extended section with new choices)
 * @param extendedSectionId - The section that was extended
 * @returns Merged story with original data preserved
 */
function mergeStories(
  originalStory: Story,
  partialStory: Story,
  extendedSectionId: string
): { story: Story; error?: string } {
  console.log('[Validator] Merging AI-generated content...');
  
  // Start with a deep copy of the original story
  const mergedStory: Story = JSON.parse(JSON.stringify(originalStory));
  
  const existingIds = Object.keys(originalStory.sections);
  const partialIds = Object.keys(partialStory.sections);
  
  // Identify truly new sections (not in original)
  const newIds = partialIds.filter(id => !existingIds.includes(id));
  console.log('[Validator] New section IDs:', newIds);
  
  // Add all truly new sections
  for (const newId of newIds) {
    const newSection = partialStory.sections[newId];
    if (newSection) {
      mergedStory.sections[newId] = newSection;
      console.log(`[Validator] Added new section: ${newId}`);
    }
  }
  
  // Handle the extended section - merge its choices
  if (partialStory.sections[extendedSectionId]) {
    const originalExtended = originalStory.sections[extendedSectionId];
    const updatedExtended = partialStory.sections[extendedSectionId];
    
    if (!originalExtended) {
      const error = `Extended section ${extendedSectionId} not found in original story`;
      console.error('[Validator]', error);
      return { story: mergedStory, error };
    }
    
    const originalChoiceCount = originalExtended.next?.length || 0;
    const updatedChoiceCount = updatedExtended?.next?.length || 0;
    
    if (updatedChoiceCount > originalChoiceCount) {
      // Add new choices from partial story
      const newChoices = updatedExtended!.next!.slice(originalChoiceCount);
      mergedStory.sections[extendedSectionId]!.next = [
        ...(originalExtended.next || []),
        ...newChoices
      ];
      console.log(`[Validator] Added ${newChoices.length} new choices to section ${extendedSectionId}`);
    }
  }
  
  // Merge meta.characters if provided
  if (partialStory.meta?.characters && Object.keys(partialStory.meta.characters).length > 0) {
    if (mergedStory.meta) {
      mergedStory.meta.characters = {
        ...(mergedStory.meta.characters || {}),
        ...partialStory.meta.characters
      };
      console.log('[Validator] Merged characters:', Object.keys(partialStory.meta.characters));
    }
  }
  
  return { story: mergedStory };
}

/**
 * Validates an AI-generated story extension.
 *
 * @param originalStory - The original story before AI extension
 * @param llmResponse - Raw text response from the LLM (should be a partial Story JSON)
 * @param extendedSectionId - The section ID that should have been extended
 * @returns Validation result with merged story if valid
 */
export function validateAiStoryUpdate(
  originalStory: Story,
  llmResponse: string,
  extendedSectionId: string
): ValidationResult {
  try {
    console.log('[Validator] Starting validation...');
    console.log('[Validator] Extended section ID:', extendedSectionId);
    console.log('[Validator] Original story section count:', Object.keys(originalStory.sections).length);
    
    // Step 1: Extract and parse JSON
    console.log('[Validator] Step 1: Extracting JSON from LLM response');
    const parsed = extractJSON(llmResponse);

    if (!parsed || typeof parsed !== 'object') {
      const error = 'LLM response is not a valid JSON object';
      console.error('[Validator]', error);
      return { valid: false, error };
    }

    const partialStory = parsed as Story;
    console.log('[Validator] JSON parsed successfully');

    // Step 2: Validate story structure
    console.log('[Validator] Step 2: Validating story structure');
    
    if (!partialStory.sections || typeof partialStory.sections !== 'object') {
      const error = 'Response is missing sections object';
      console.error('[Validator]', error);
      return { valid: false, error };
    }

    const existingIds = Object.keys(originalStory.sections);
    const partialIds = Object.keys(partialStory.sections);
    const newIds = partialIds.filter(id => !existingIds.includes(id));
    
    console.log('[Validator] Sections in response:', partialIds.length, partialIds);
    console.log('[Validator] New sections:', newIds.length, newIds);

    // Step 3: Check that at least some new content was added
    if (newIds.length === 0 && !partialStory.sections[extendedSectionId]) {
      const error = 'Response contains no new sections and does not include the extended section';
      console.error('[Validator]', error);
      return { valid: false, error };
    }

    // Step 4: Validate new section structure
    console.log('[Validator] Step 3: Validating new section structure');
    for (const newId of newIds) {
      const section = partialStory.sections[newId];
      
      if (!section) {
        const error = `Section ${newId} is undefined`;
        console.error('[Validator]', error);
        return { valid: false, error };
      }

      if (!section.id || section.id !== newId) {
        const error = `Section ${newId} has mismatched or missing id field (expected: ${newId}, got: ${section.id})`;
        console.error('[Validator]', error);
        return { valid: false, error };
      }

      // Validate section has either text or text_lines
      if (!section.text && !section.text_lines) {
        const error = `Section ${newId} is missing both text and text_lines`;
        console.error('[Validator]', error);
        return { valid: false, error };
      }

      // Warn if section doesn't have ai_gen (but don't fail - allow flexibility)
      if (!section.ai_gen || !section.ai_gen.prompt) {
        console.warn(`[Validator] Warning: Section ${newId} is missing ai_gen.prompt (recommended for AI-generated sections)`);
      }
    }

    // Step 5: Validate graph integrity for all sections in response
    console.log('[Validator] Step 4: Validating choice references');
    const allSectionIds = new Set([
      ...existingIds,
      ...newIds
    ]);

    for (const [sectionId, section] of Object.entries(partialStory.sections)) {
      const choices = section?.next || [];
      for (const choice of choices) {
        const targetId = choice.next.toString();
        if (!allSectionIds.has(targetId)) {
          const error = `Section ${sectionId} has choice pointing to non-existent section ${targetId}`;
          console.error('[Validator]', error);
          return { valid: false, error };
        }
      }
    }
    console.log('[Validator] All choice references are valid');

    // Step 6: Merge partial story into original
    console.log('[Validator] Step 5: Merging partial story into original');
    const mergeResult = mergeStories(originalStory, partialStory, extendedSectionId);
    
    if (mergeResult.error) {
      console.error('[Validator] Merge failed:', mergeResult.error);
      return { valid: false, error: mergeResult.error };
    }

    // Step 7: Final validation of merged story
    console.log('[Validator] Step 6: Final validation of merged story');
    if (!validateGraphIntegrity(mergeResult.story)) {
      const error = 'Merged story graph has invalid section references';
      console.error('[Validator]', error);
      return { valid: false, error };
    }
    
    console.log('[Validator] Validation complete: All checks passed');
    console.log('[Validator] Final section count:', Object.keys(mergeResult.story.sections).length);
    
    return {
      valid: true,
      story: mergeResult.story,
    };
  } catch (error) {
    const errorMsg = `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('[Validator]', errorMsg);
    return { valid: false, error: errorMsg };
  }
}
