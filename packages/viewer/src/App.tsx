/**
 * Main App component managing viewer state and coordination.
 */

import { useState, useCallback, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import type { Story, StoryState } from '@story-adventure/shared';
import { MenuScreen } from './components/MenuScreen';
import { StoryPlayer } from './components/StoryPlayer';
import { ChoiceButtons } from './components/ChoiceButtons';
import { HelpModal } from './components/HelpModal';
import { BackgroundImage } from './components/BackgroundImage';
import { useStoryPlayer } from './hooks/useStoryPlayer';
import { useHotkeys } from './hooks/useHotkeys';
import { useAiExpansion } from './hooks/useAiExpansion';
import { loadFile } from './utils/fileLoader';
import { saveAs } from './utils/fileSaver';
import { useToast } from './components/modals/ToastContainer';
import { useDialog } from './components/modals/DialogContext';
import { get_file_safe_title } from '@story-adventure/shared';
import {
  getAiExpansionConsent,
  setAiExpansionConsent,
  hasValidLlmEndpoint,
  setLlmEndpoint,
} from './utils/aiPreferences';
import type { LlmEndpoint } from '@story-adventure/shared';

// Override INPUT action to use modal prompt()
import { supported_actions } from '@story-adventure/shared';

function App() {
  const toast = useToast();
  const dialog = useDialog();
  const [showHelp, setShowHelp] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [aiExpansionEnabled, setAiExpansionEnabled] = useState<boolean>(false);

  // Override INPUT action handler to use modal prompt
  useEffect(() => {
    supported_actions.INPUT.action = async (story, parameters) => {
      if (!parameters || parameters.length < 2 || !parameters[1]) {
        console.error('Need two parameters to ask for input', parameters);
        return;
      }
      const userInput = await dialog.prompt(parameters[1]);
      if (userInput !== null && parameters[0]) {
        supported_actions.SET.action(story, [parameters[0], userInput]);
      }
    };
  }, [dialog]);

  const {
    story,
    currentSectionId,
    viewerState,
    isLoading: playerLoading,
    loadStory,
    loadSection,
    oneStepForward,
    oneStepBack,
    getCurrentSection,
    getCurrentSectionText,
    getCurrentChoices,
  } = useStoryPlayer();

  // Check if story has AI extension capabilities
  const storyHasAiCapabilities = useCallback((storyData: Story): boolean => {
    // Check if any section is ai_extendable
    return Object.values(storyData.sections).some(
      (section) => section.ai_extendable === true
    );
  }, []);

  // Callback to update story when AI extends it
  const handleAiStoryUpdate = useCallback(
    (updatedStory: Story) => {
      loadStory(updatedStory);
    },
    [loadStory]
  );

  // AI expansion hook
  useAiExpansion({
    story,
    currentSectionId,
    enabled: aiExpansionEnabled,
    onStoryUpdate: handleAiStoryUpdate,
  });

  // Load story from file
  const handleLoadFile = useCallback(async () => {
    try {
      setIsLoading(true);
      const content = await loadFile();
      try {
        const storyData = JSON.parse(content) as Story;
        loadStory(storyData);
        toast.toastOk('Story Adventure Loaded');
        toast.toastInfo("Press '?' to display the viewer help.");
      } catch (error) {
        toast.toastAlert('Not a valid json');
        console.error(error);
      }
    } catch (error) {
      toast.toastAlert('Failed to load file');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [loadStory, toast]);

  // Check for AI consent after story loads
  useEffect(() => {
    if (!story) {
      return;
    }

    // Check if story has AI-extendable sections
    if (!storyHasAiCapabilities(story)) {
      return;
    }

    // Check if LLM endpoint is configured
    const hasEndpoint = hasValidLlmEndpoint();

    // Check localStorage for existing consent
    const existingConsent = getAiExpansionConsent();

    if (existingConsent !== null && hasEndpoint) {
      // User has already made a choice and has endpoint configured
      setAiExpansionEnabled(existingConsent);
      return;
    }

    // Show configuration/consent dialog
    const showAiSetupDialog = async () => {
      if (!hasEndpoint) {
        // No endpoint configured - offer to set it up
        const wantsToSetup = await dialog.confirm(
          'This story supports AI-powered expansion, which can dynamically generate new content. To use this feature, you need to configure an LLM endpoint (like OpenAI). Would you like to set this up now?',
          'AI Story Expansion Available'
        );

        if (!wantsToSetup) {
          setAiExpansionEnabled(false);
          return;
        }

        // Prompt for endpoint configuration
        const url = await dialog.prompt(
          'Enter the LLM API endpoint URL (e.g., https://api.openai.com/v1/chat/completions):',
          'https://api.openai.com/v1/chat/completions',
          'Configure LLM Endpoint'
        );

        if (!url || url.trim().length === 0) {
          toast.toastInfo('AI expansion setup cancelled');
          setAiExpansionEnabled(false);
          return;
        }

        const apiKey = await dialog.prompt(
          'Enter your API key (optional, but usually required):',
          '',
          'API Key'
        );

        const model = await dialog.prompt(
          'Enter model name (optional, leave empty for server default):',
          '',
          'Model Name'
        );

        // Save the endpoint configuration
        const endpoint: LlmEndpoint = {
          url: url.trim(),
          api_key: apiKey && apiKey.trim().length > 0 ? apiKey.trim() : undefined,
          model: model && model.trim().length > 0 ? model.trim() : undefined,
          type: 'openai',
        };

        setLlmEndpoint(endpoint);
        toast.toastOk('LLM endpoint configured successfully!');
      }

      // Now ask for consent
      const confirmed = await dialog.confirm(
        'Your configured LLM endpoint will be called to dynamically generate new story content and images based on the existing story. Do you want to enable AI expansion for this session?',
        'Enable AI Story Expansion?'
      );

      setAiExpansionEnabled(confirmed);

      // Ask if user wants to remember this choice
      if (confirmed) {
        const remember = await dialog.confirm(
          'Would you like to remember this choice for future AI-capable stories?',
          'Remember AI Expansion Preference?'
        );
        if (remember) {
          setAiExpansionConsent(true);
        }
      }
    };

    showAiSetupDialog();
  }, [story, dialog, storyHasAiCapabilities, toast]);

  // Load story from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loadParam = params.get('load');
    if (loadParam) {
      setIsLoading(true);
      toast.toastInfo('Loading story from ' + loadParam);
      fetch(loadParam)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Failed to fetch story');
        })
        .then((json: Story) => {
          loadStory(json);
          toast.toastOk('Story Adventure Loaded');
          toast.toastInfo("Press '?' to display the viewer help.");
        })
        .catch((error) => {
          toast.toastAlert('Error loading story from ' + loadParam);
          console.error('error loading url:', loadParam, error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [loadStory, toast]);

  // Save progress
  const handleSaveProgress = useCallback(() => {
    if (!story) {
      toast.toastAlert('No story loaded');
      return;
    }
    const blob = new Blob(
      [
        JSON.stringify(
          {
            meta: story.meta,
            state: story.state,
          },
          null,
          2
        ),
      ],
      {
        type: 'text/json;charset=utf-8',
      }
    );
    saveAs(blob, get_file_safe_title(story) + '_save.json');
  }, [story, toast]);

  // Load progress
  const handleLoadProgress = useCallback(async () => {
    if (!story?.meta?.title) {
      toast.toastAlert('Please load the story first!');
      return;
    }
    try {
      const content = await loadFile();
      const saved = JSON.parse(content) as { meta?: { title?: string }; state?: StoryState };
      if (story.meta.title !== saved.meta?.title) {
        toast.toastAlert(
          `The loaded story is '${story.meta.title}' but the save game is for '${saved.meta?.title}'`
        );
        return;
      }
      story.state = saved.state;
      loadStory(story);
    } catch (error) {
      toast.toastAlert('Failed to load save file');
      console.error(error);
    }
  }, [story, loadStory, toast]);

  // Toggle fullscreen
  const handleFullscreen = useCallback(() => {
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
  }, []);

  // Handle global click (advance if single choice)
  const handleGlobalClick = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        !currentSectionId
      ) {
        return;
      }
      oneStepForward();
    },
    [currentSectionId, oneStepForward]
  );

  useEffect(() => {
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [handleGlobalClick]);

  // Setup hotkeys
  const { getHotkeyDefinitions } = useHotkeys({
    onBack: oneStepBack,
    onForward: oneStepForward,
    onFullscreen: handleFullscreen,
    onToggleText: () => setTextVisible((prev) => !prev),
    onShowHelp: () => setShowHelp(true),
    onSaveProgress: handleSaveProgress,
    onLoadProgress: handleLoadProgress,
    story,
    enabled: viewerState === 'PLAYING',
  });

  const currentSection = getCurrentSection();
  const sectionText = getCurrentSectionText();
  const choices = getCurrentChoices();
  const hotkeys = getHotkeyDefinitions();

  return (
    <>
      <BackgroundImage media={currentSection?.media} />
      {(isLoading || playerLoading) && (
        <div
          className="text-center"
          style={{
            position: 'fixed',
            top: '50vh',
            width: '100vw',
          }}
        >
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {viewerState === 'MENU' && (
        <MenuScreen
          onLoadFile={handleLoadFile}
          aiExpansionEnabled={aiExpansionEnabled}
          onAiExpansionToggle={(enabled) => {
            setAiExpansionEnabled(enabled);
            setAiExpansionConsent(enabled);
          }}
        />
      )}
      {viewerState === 'PLAYING' && (
        <Container
          id="story_container"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            maxWidth: '99vw',
            position: 'absolute',
            bottom: '10px',
            left: 0,
          }}
        >
          <StoryPlayer text={sectionText} isVisible={textVisible} />
          <ChoiceButtons
            choices={choices}
            onChoiceClick={(next) => loadSection(next.toString())}
          />
        </Container>
      )}
      <HelpModal
        show={showHelp}
        onHide={() => setShowHelp(false)}
        hotkeys={hotkeys}
      />
    </>
  );
}

export default App;
