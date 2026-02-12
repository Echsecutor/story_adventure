/**
 * Hook for managing AI-powered story expansion with look-ahead.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { Story } from '@story-adventure/shared';
import {
  buildPromptMessages,
  callLlmStreaming,
  validateAiStoryUpdate,
  getLlmEndpoint,
  hasValidLlmEndpoint,
} from '@story-adventure/shared';
import { useToast } from '../components/modals/ToastContainer';

/**
 * Options for the AI expansion hook.
 */
export interface UseAiExpansionOptions {
  /** Current story object */
  story: Story | null;
  /** Current section ID the player is viewing */
  currentSectionId: string | null;
  /** Whether AI expansion is enabled (user consent given) */
  enabled: boolean;
  /** Callback to update the story when AI extends it */
  onStoryUpdate: (updatedStory: Story) => void;
}

/**
 * Performs BFS traversal to find reachable sections up to maxDepth.
 *
 * @param story - The story graph
 * @param startSectionId - Section to start from
 * @param maxDepth - Maximum depth to traverse
 * @returns Set of reachable section IDs
 */
function findReachableSections(
  story: Story,
  startSectionId: string,
  maxDepth: number
): Set<string> {
  const reachable = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: startSectionId, depth: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.id) || current.depth > maxDepth) {
      continue;
    }

    visited.add(current.id);
    reachable.add(current.id);

    const section = story.sections[current.id];
    if (!section?.next) {
      continue;
    }

    // Add all choices to the queue
    for (const choice of section.next) {
      const nextId = choice.next.toString();
      if (!visited.has(nextId)) {
        queue.push({ id: nextId, depth: current.depth + 1 });
      }
    }
  }

  return reachable;
}

/**
 * Hook for managing AI story expansion with look-ahead.
 */
export function useAiExpansion(options: UseAiExpansionOptions): void {
  const { story, currentSectionId, enabled, onStoryUpdate } = options;
  const toast = useToast();

  // Track sections currently being processed to avoid duplicate calls
  const processingRef = useRef<Set<string>>(new Set());
  // Track sections already extended to avoid re-extending
  const extendedRef = useRef<Set<string>>(new Set());

  /**
   * Checks if a story has AI extension capabilities (AI-extendable sections).
   */
  const hasAiExtensionConfig = useCallback((story: Story): boolean => {
    // Check if any section is marked as ai_extendable
    return Object.values(story.sections).some(
      (section) => section?.ai_extendable === true
    );
  }, []);

  /**
   * Finds the first ai_extendable section within look-ahead range.
   */
  const findExtendableSection = useCallback(
    (story: Story, fromSectionId: string): string | null => {
      const lookAhead = story.meta?.ai_gen_look_ahead || 2;
      const reachable = findReachableSections(story, fromSectionId, lookAhead);

      // Find first ai_extendable section that hasn't been extended yet
      for (const sectionId of reachable) {
        const section = story.sections[sectionId];
        if (
          section?.ai_extendable === true &&
          !extendedRef.current.has(sectionId) &&
          !processingRef.current.has(sectionId)
        ) {
          return sectionId;
        }
      }

      return null;
    },
    []
  );

  /**
   * Extends a story section using AI.
   */
  const extendSection = useCallback(
    async (story: Story, sectionId: string): Promise<void> => {
      const endpoint = getLlmEndpoint();
      if (!endpoint || !endpoint.url) {
        console.error('[AI Expansion] No LLM endpoint configured in browser localStorage');
        toast.toastAlert('Please configure LLM endpoint in AI settings');
        return;
      }

      // Mark as processing
      processingRef.current.add(sectionId);

      try {
        console.log(`[AI Expansion] Extending section ${sectionId}...`);
        toast.toastInfo(`Generating new story content from section ${sectionId}...`);

        // Build prompt messages
        const lookAhead = story.meta?.ai_gen_look_ahead || 2;
        const messages = buildPromptMessages(story, sectionId, lookAhead);

        // Call LLM API
        const response = await callLlmStreaming({
          endpoint,
          messages,
        });

        if (!response.success || !response.content) {
          console.error('[AI Expansion] LLM call failed:', response.error);
          toast.toastAlert(`AI extension failed: ${response.error || 'Unknown error'}`);
          processingRef.current.delete(sectionId);
          return;
        }

        console.log(
          '[AI Expansion] LLM response received, length:',
          response.content.length
        );
        console.log('[AI Expansion] Complete LLM response:', response.content);

        // Validate the response
        const validation = validateAiStoryUpdate(story, response.content, sectionId);

        if (!validation.valid || !validation.story) {
          console.error('[AI Expansion] Validation failed:', validation.error);
          toast.toastAlert(`AI extension validation failed: ${validation.error}`);
          processingRef.current.delete(sectionId);
          return;
        }

        // Apply the update
        console.log('[AI Expansion] Validation passed, applying update');
        onStoryUpdate(validation.story);

        // Mark section as extended
        extendedRef.current.add(sectionId);
        processingRef.current.delete(sectionId);

        toast.toastOk('Story extended with AI-generated content!');
      } catch (error) {
        console.error('[AI Expansion] Unexpected error:', error);
        toast.toastAlert(
          `AI extension error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        processingRef.current.delete(sectionId);
      }
    },
    [onStoryUpdate, toast]
  );

  /**
   * Check for extendable sections and trigger extension if needed.
   */
  const checkAndExtend = useCallback(async () => {
    if (!enabled || !story || !currentSectionId) {
      return;
    }

    // Check if story has AI-extendable sections
    if (!hasAiExtensionConfig(story)) {
      return;
    }

    // Check if LLM endpoint is configured in browser
    if (!hasValidLlmEndpoint()) {
      return;
    }

    // Find an extendable section within look-ahead range
    const extendableSectionId = findExtendableSection(story, currentSectionId);

    if (extendableSectionId) {
      console.log(
        `[AI Expansion] Found extendable section ${extendableSectionId} within look-ahead from ${currentSectionId}`
      );
      await extendSection(story, extendableSectionId);
    }
  }, [
    enabled,
    story,
    currentSectionId,
    hasAiExtensionConfig,
    findExtendableSection,
    extendSection,
  ]);

  // Effect: Check for extendable sections when current section changes
  useEffect(() => {
    checkAndExtend();
  }, [checkAndExtend]);

  // Reset extended sections tracking when story changes
  useEffect(() => {
    extendedRef.current.clear();
    processingRef.current.clear();
  }, [story?.meta?.title]); // Reset when story changes (detected by title change)
}
