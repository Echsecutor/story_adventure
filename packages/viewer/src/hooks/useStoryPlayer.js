/**
 * Hook for managing story player state, navigation, and history.
 */
import { useState, useCallback } from 'react';
import { execute_actions, get_text_from_section, replace_variables } from '@story-adventure/shared';
import { toastAlert } from '../utils/toast';
/**
 * Custom hook for managing story player state and navigation.
 */
export function useStoryPlayer() {
    const [state, setState] = useState({
        story: null,
        currentSectionId: null,
        history: [],
        viewerState: 'MENU',
        isLoading: false,
    });
    /**
     * Loads a story and starts playing from the first section.
     */
    const loadStory = useCallback((story) => {
        if (!story?.sections) {
            toastAlert('No Story loaded');
            setState((prev) => ({ ...prev, viewerState: 'MENU' }));
            return;
        }
        if (!story.state) {
            story.state = {};
        }
        // Find first section if current_section is invalid
        if (!story.state.current_section ||
            !story.sections[story.state.current_section]) {
            const sectionKeys = Object.keys(story.sections);
            if (sectionKeys.length === 0) {
                toastAlert('This story has no sections. Please load a different one.');
                return;
            }
            story.state.current_section = sectionKeys[0];
        }
        // Initialize history if needed
        if (!story.state.history) {
            story.state.history = [];
        }
        setState({
            story,
            currentSectionId: story.state.current_section || null,
            history: story.state.history || [],
            viewerState: 'PLAYING',
            isLoading: false,
        });
    }, []);
    /**
     * Navigates to a specific section.
     */
    const loadSection = useCallback((sectionId, addToHistory = true) => {
        setState((prev) => {
            if (!prev.story) {
                return prev;
            }
            const section = prev.story.sections[sectionId];
            if (!section) {
                toastAlert(`Section ${sectionId} is missing from the story`);
                return prev;
            }
            // Execute section script if present
            if (section.script) {
                execute_actions(prev.story, section.script);
            }
            // Update history
            const newHistory = addToHistory
                ? [...prev.history, prev.currentSectionId].filter(Boolean)
                : prev.history;
            // Update story state
            if (!prev.story.state) {
                prev.story.state = {};
            }
            prev.story.state.current_section = sectionId;
            prev.story.state.history = newHistory;
            return {
                ...prev,
                currentSectionId: sectionId,
                history: newHistory,
            };
        });
    }, []);
    /**
     * Navigates one step forward (if there's only one choice).
     */
    const oneStepForward = useCallback(() => {
        setState((prev) => {
            if (!prev.story || !prev.currentSectionId) {
                return prev;
            }
            const section = prev.story.sections[prev.currentSectionId];
            if (!section?.next || section.next.length !== 1) {
                return prev;
            }
            const nextSectionId = section.next[0]?.next?.toString();
            if (!nextSectionId) {
                return prev;
            }
            const nextSection = prev.story.sections[nextSectionId];
            if (!nextSection) {
                return prev;
            }
            // Execute section script if present
            if (nextSection.script) {
                execute_actions(prev.story, nextSection.script);
            }
            // Update history
            const newHistory = [...prev.history, prev.currentSectionId].filter(Boolean);
            // Update story state
            if (!prev.story.state) {
                prev.story.state = {};
            }
            prev.story.state.current_section = nextSectionId;
            prev.story.state.history = newHistory;
            return {
                ...prev,
                currentSectionId: nextSectionId,
                history: newHistory,
            };
        });
    }, []);
    /**
     * Navigates one step back in history.
     */
    const oneStepBack = useCallback(() => {
        setState((prev) => {
            if (prev.history.length < 1 || !prev.story) {
                return prev;
            }
            const previousSectionId = prev.history[prev.history.length - 1];
            if (!previousSectionId) {
                return prev;
            }
            const previousSection = prev.story.sections[previousSectionId];
            if (!previousSection) {
                return prev;
            }
            const newHistory = prev.history.slice(0, -1);
            // Execute section script if present
            if (previousSection.script) {
                execute_actions(prev.story, previousSection.script);
            }
            // Update story state
            if (!prev.story.state) {
                prev.story.state = {};
            }
            prev.story.state.current_section = previousSectionId;
            prev.story.state.history = newHistory;
            return {
                ...prev,
                currentSectionId: previousSectionId,
                history: newHistory,
            };
        });
    }, []);
    /**
     * Gets the current section object.
     */
    const getCurrentSection = useCallback(() => {
        if (!state.story || !state.currentSectionId) {
            return null;
        }
        return state.story.sections[state.currentSectionId] || null;
    }, [state.story, state.currentSectionId]);
    /**
     * Gets the text content for the current section with variable interpolation.
     */
    const getCurrentSectionText = useCallback(() => {
        const section = getCurrentSection();
        if (!section) {
            return '';
        }
        return get_text_from_section(section, state.story?.state?.variables);
    }, [getCurrentSection, state.story?.state?.variables]);
    /**
     * Gets choices for the current section with variable interpolation.
     */
    const getCurrentChoices = useCallback(() => {
        const section = getCurrentSection();
        if (!section?.next) {
            return [];
        }
        return section.next.map((choice) => ({
            ...choice,
            text: replace_variables(choice.text, state.story?.state?.variables),
        }));
    }, [getCurrentSection, state.story?.state?.variables]);
    /**
     * Sets loading state.
     */
    const setLoading = useCallback((isLoading) => {
        setState((prev) => ({ ...prev, isLoading }));
    }, []);
    return {
        story: state.story,
        currentSectionId: state.currentSectionId,
        viewerState: state.viewerState,
        isLoading: state.isLoading,
        loadStory,
        loadSection,
        oneStepForward,
        oneStepBack,
        getCurrentSection,
        getCurrentSectionText,
        getCurrentChoices,
        setLoading,
    };
}
