/**
 * Hook for handling editor keyboard shortcuts.
 */

import { useEffect } from 'react';
import type { Story, Section } from '@story-adventure/shared';

export interface HotkeyHandlers {
  onAddSection?: () => void;
  onLoadMedia?: () => void;
  onNavigateRight?: () => void;
  onNavigateLeft?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
}

export interface NavigationContext {
  story: Story;
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
}

/**
 * Hook that registers global keyboard shortcuts.
 * Only active when focus is not on input/textarea elements.
 */
export function useHotkeys(handlers: HotkeyHandlers, navigationContext?: NavigationContext) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }
      
      // Handle hotkeys
      if (event.key === 's' && handlers.onAddSection) {
        event.preventDefault();
        event.stopPropagation();
        handlers.onAddSection();
      } else if (event.key === 'm' && handlers.onLoadMedia) {
        event.preventDefault();
        event.stopPropagation();
        handlers.onLoadMedia();
      } else if (navigationContext && navigationContext.selectedSectionId) {
        // Arrow key navigation
        const { story, selectedSectionId, onSelectSection } = navigationContext;
        const currentSection = story.sections[selectedSectionId];
        
        if (!currentSection) {
          return;
        }
        
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          event.stopPropagation();
          if (currentSection.next && currentSection.next.length > 0 && currentSection.next[0]) {
            const nextSectionId = String(currentSection.next[0].next);
            if (story.sections[nextSectionId]) {
              onSelectSection(nextSectionId);
            }
          }
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          event.stopPropagation();
          // Find parent section (section that has a choice pointing to current)
          for (const sectionId in story.sections) {
            const section = story.sections[sectionId];
            if (section && section.next) {
              for (const choice of section.next) {
                if (String(choice.next) === selectedSectionId) {
                  onSelectSection(sectionId);
                  return;
                }
              }
            }
          }
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          event.stopPropagation();
          // Find parent and navigate to sibling
          let parentSection: Section | null = null;
          let siblingIndex: number | null = null;
          
          for (const sectionId in story.sections) {
            const section = story.sections[sectionId];
            if (section && section.next) {
              for (let i = 0; i < section.next.length; i++) {
                const choice = section.next[i];
                if (choice && String(choice.next) === selectedSectionId) {
                  parentSection = section;
                  siblingIndex = i;
                  break;
                }
              }
            }
            if (parentSection) break;
          }
          
            if (parentSection && siblingIndex !== null && parentSection.next) {
            let newIndex: number;
            if (event.key === 'ArrowUp') {
              newIndex = siblingIndex > 0 ? siblingIndex - 1 : parentSection.next.length - 1;
            } else {
              newIndex = siblingIndex < parentSection.next.length - 1 ? siblingIndex + 1 : 0;
            }
            const targetChoice = parentSection.next[newIndex];
            if (targetChoice) {
              const targetSectionId = String(targetChoice.next);
              if (story.sections[targetSectionId]) {
                onSelectSection(targetSectionId);
              }
            }
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers, navigationContext]);
}
