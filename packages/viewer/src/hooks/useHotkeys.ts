/**
 * Hook for managing keyboard hotkeys in the viewer.
 */

import { useEffect, useCallback } from 'react';

interface HotkeyDefinition {
  description: string;
  action: () => void;
  aliases?: string[];
}

interface UseHotkeysOptions {
  onBack: () => void;
  onForward: () => void;
  onFullscreen: () => void;
  onToggleText: () => void;
  onShowHelp: () => void;
  onSaveProgress: () => void;
  onLoadProgress: () => void;
  story: { meta?: { title?: string }; state?: unknown } | null;
  enabled: boolean;
}

/**
 * Custom hook for managing keyboard hotkeys.
 */
export function useHotkeys({
  onBack,
  onForward,
  onFullscreen,
  onToggleText,
  onShowHelp,
  onSaveProgress,
  onLoadProgress,
  story,
  enabled,
}: UseHotkeysOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      // Don't handle hotkeys when typing in inputs
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const key = event.key;

      // Map keys to actions
      if (key === 'b' || key === 'ArrowLeft' || key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        onBack();
        return;
      }

      if (
        key === 'n' ||
        key === 'ArrowRight' ||
        key === 'ArrowDown' ||
        key === ' ' ||
        key === 'Spacebar'
      ) {
        event.preventDefault();
        event.stopPropagation();
        onForward();
        return;
      }

      if (key === 's') {
        event.preventDefault();
        event.stopPropagation();
        onSaveProgress();
        return;
      }

      if (key === 'l') {
        event.preventDefault();
        event.stopPropagation();
        onLoadProgress();
        return;
      }

      if (key === 'f') {
        event.preventDefault();
        event.stopPropagation();
        onFullscreen();
        return;
      }

      if (key === 'h') {
        event.preventDefault();
        event.stopPropagation();
        onToggleText();
        return;
      }

      if (key === '?') {
        event.preventDefault();
        event.stopPropagation();
        onShowHelp();
        return;
      }
    },
    [
      enabled,
      onBack,
      onForward,
      onSaveProgress,
      onLoadProgress,
      onFullscreen,
      onToggleText,
      onShowHelp,
    ]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  /**
   * Gets hotkey definitions for display in help modal.
   */
  const getHotkeyDefinitions = useCallback((): Record<string, HotkeyDefinition> => {
    return {
      b: {
        description: 'One step back',
        action: onBack,
        aliases: ['ArrowLeft', 'ArrowUp'],
      },
      n: {
        description: 'Proceed to next story section (if there is only one choice)',
        action: onForward,
        aliases: ['ArrowRight', 'ArrowDown', 'Spacebar', ' '],
      },
      s: {
        description: 'Save your progress for the current adventure',
        action: onSaveProgress,
      },
      l: {
        description:
          'Load progress for the current adventure. (load the adventure first)',
        action: onLoadProgress,
      },
      f: {
        description: 'Toggle full screen',
        action: () => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
            return;
          }
          const element = document.body;
          const requestMethod =
            (element as unknown as { requestFullscreen?: () => Promise<void> })
              .requestFullscreen ||
            (element as unknown as { webkitRequestFullScreen?: () => Promise<void> })
              .webkitRequestFullScreen ||
            (element as unknown as { mozRequestFullScreen?: () => Promise<void> })
              .mozRequestFullScreen ||
            (element as unknown as { msRequestFullScreen?: () => Promise<void> })
              .msRequestFullScreen;
          if (requestMethod) {
            requestMethod.call(element);
          }
        },
      },
      h: {
        description: 'Toggle show/hide text',
        action: onToggleText,
      },
      '?': {
        description: 'Show help',
        action: onShowHelp,
      },
    };
  }, [story, onBack, onForward, onLoadProgress, onToggleText, onShowHelp, onSaveProgress]);

  return {
    getHotkeyDefinitions,
  };
}
