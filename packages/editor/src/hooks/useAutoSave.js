/**
 * Hook for auto-saving story to IndexedDB every 30 seconds.
 */
import { useEffect, useRef } from 'react';
import { save_story } from '@story-adventure/shared';
const CURRENT_EDITOR_STORY_KEY = 'current_editor_story';
const AUTO_SAVE_INTERVAL_MS = 30000; // 30 seconds
/**
 * Hook that auto-saves the story to IndexedDB every 30 seconds.
 */
export function useAutoSave(story) {
    const storyRef = useRef(story);
    // Keep ref updated
    useEffect(() => {
        storyRef.current = story;
    }, [story]);
    useEffect(() => {
        const intervalId = setInterval(async () => {
            try {
                await save_story(CURRENT_EDITOR_STORY_KEY, storyRef.current);
                console.debug('Auto-saved story');
            }
            catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, AUTO_SAVE_INTERVAL_MS);
        return () => {
            clearInterval(intervalId);
        };
    }, []);
}
