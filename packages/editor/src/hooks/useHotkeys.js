/**
 * Hook for handling editor keyboard shortcuts.
 */
import { useEffect } from 'react';
/**
 * Hook that registers global keyboard shortcuts.
 * Only active when focus is not on input/textarea elements.
 */
export function useHotkeys(handlers, navigationContext) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ignore if typing in input/textarea
            const activeElement = document.activeElement;
            if (activeElement &&
                (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            // Handle hotkeys
            if (event.key === 's' && handlers.onAddSection) {
                event.preventDefault();
                event.stopPropagation();
                handlers.onAddSection();
            }
            else if (event.key === 'm' && handlers.onLoadMedia) {
                event.preventDefault();
                event.stopPropagation();
                handlers.onLoadMedia();
            }
            else if (navigationContext && navigationContext.selectedSectionId) {
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
                }
                else if (event.key === 'ArrowLeft') {
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
                }
                else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    event.preventDefault();
                    event.stopPropagation();
                    // Find parent and navigate to sibling
                    let parentSection = null;
                    let siblingIndex = null;
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
                        if (parentSection)
                            break;
                    }
                    if (parentSection && siblingIndex !== null && parentSection.next) {
                        let newIndex;
                        if (event.key === 'ArrowUp') {
                            newIndex = siblingIndex > 0 ? siblingIndex - 1 : parentSection.next.length - 1;
                        }
                        else {
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
