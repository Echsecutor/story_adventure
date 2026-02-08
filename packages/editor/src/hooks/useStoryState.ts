/**
 * Hook for managing story state with CRUD operations for sections and choices.
 */

import { useState, useCallback } from 'react';
import type { Story, Section, Choice } from '@story-adventure/shared';

/**
 * Hook for managing story state.
 */
export function useStoryState() {
  const [story, setStory] = useState<Story>(() => {
    // Initialize with empty story
    return {
      sections: {
        '1': {
          id: '1',
          text_lines: [''],
        },
      },
    };
  });

  /**
   * Loads a story and updates state.
   */
  const loadStory = useCallback((newStory: Story) => {
    setStory(newStory);
  }, []);

  /**
   * Creates a new empty story.
   */
  const newStory = useCallback(() => {
    const emptyStory: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: [''],
        },
      },
    };
    setStory(emptyStory);
  }, []);

  /**
   * Adds a new section to the story.
   * Returns the new section ID.
   */
  const addSection = useCallback((): string => {
    let nextId = 1;
    const sectionIds = Object.keys(story.sections)
      .map((key) => parseInt(key))
      .filter((num) => !isNaN(num));
    
    if (sectionIds.length > 0) {
      nextId = Math.max(...sectionIds) + 1;
    }
    
    const sectionId = String(nextId);
    const newSection: Section = {
      id: sectionId,
      text_lines: [''],
    };
    
    setStory((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: newSection,
      },
    }));
    
    return sectionId;
  }, [story.sections]);

  /**
   * Updates a section in the story.
   */
  const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
    setStory((prev) => {
      const section = prev.sections[sectionId];
      if (!section) {
        return prev;
      }
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...section,
            ...updates,
          },
        },
      };
    });
  }, []);

  /**
   * Deletes a section from the story.
   */
  const deleteSection = useCallback((sectionId: string) => {
    setStory((prev) => {
      const newSections = { ...prev.sections };
      delete newSections[sectionId];
      
      // Remove choices pointing to deleted section
      for (const id in newSections) {
        const section = newSections[id];
        if (section && section.next) {
          section.next = section.next.filter(
            (choice) => String(choice.next) !== sectionId
          );
        }
      }
      
      return {
        ...prev,
        sections: newSections,
      };
    });
  }, []);

  /**
   * Adds a choice (edge) from one section to another.
   */
  const addChoice = useCallback((sourceSectionId: string, targetSectionId: string, text: string = '') => {
    setStory((prev) => {
      const section = prev.sections[sourceSectionId];
      if (!section) {
        return prev;
      }
      
      const newChoice: Choice = {
        text,
        next: targetSectionId,
      };
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sourceSectionId]: {
            ...section,
            next: [...(section.next || []), newChoice],
          },
        },
      };
    });
  }, []);

  /**
   * Deletes a choice (edge) from a section.
   */
  const deleteChoice = useCallback((sourceSectionId: string, targetSectionId: string) => {
    setStory((prev) => {
      const section = prev.sections[sourceSectionId];
      if (!section || !section.next) {
        return prev;
      }
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sourceSectionId]: {
            ...section,
            next: section.next.filter(
              (choice) => String(choice.next) !== targetSectionId
            ),
          },
        },
      };
    });
  }, []);

  /**
   * Updates a choice's text.
   */
  const updateChoice = useCallback((
    sourceSectionId: string,
    targetSectionId: string,
    text: string
  ) => {
    setStory((prev) => {
      const section = prev.sections[sourceSectionId];
      if (!section || !section.next) {
        return prev;
      }
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sourceSectionId]: {
            ...section,
            next: section.next.map((choice) =>
              String(choice.next) === targetSectionId
                ? { ...choice, text }
                : choice
            ),
          },
        },
      };
    });
  }, []);

  /**
   * Sets story variables.
   */
  const setVariables = useCallback((variables: Record<string, string>) => {
    setStory((prev) => ({
      ...prev,
      state: {
        ...prev.state,
        variables,
      },
    }));
  }, []);

  /**
   * Adds or updates a variable.
   */
  const setVariable = useCallback((name: string, value: string) => {
    setStory((prev) => {
      const currentVariables = prev.state?.variables || {};
      return {
        ...prev,
        state: {
          ...prev.state,
          variables: {
            ...currentVariables,
            [name]: value,
          },
        },
      };
    });
  }, []);

  /**
   * Deletes a variable.
   */
  const deleteVariable = useCallback((name: string) => {
    setStory((prev) => {
      const currentVariables = prev.state?.variables || {};
      const newVariables = { ...currentVariables };
      delete newVariables[name];
      return {
        ...prev,
        state: {
          ...prev.state,
          variables: newVariables,
        },
      };
    });
  }, []);

  return {
    story,
    loadStory,
    newStory,
    addSection,
    updateSection,
    deleteSection,
    addChoice,
    deleteChoice,
    updateChoice,
    setVariables,
    setVariable,
    deleteVariable,
  };
}
