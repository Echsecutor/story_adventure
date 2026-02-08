import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Main App component managing viewer state and coordination.
 */
import { useState, useCallback, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { MenuScreen } from './components/MenuScreen';
import { StoryPlayer } from './components/StoryPlayer';
import { ChoiceButtons } from './components/ChoiceButtons';
import { HelpModal } from './components/HelpModal';
import { BackgroundImage } from './components/BackgroundImage';
import { useStoryPlayer } from './hooks/useStoryPlayer';
import { useHotkeys } from './hooks/useHotkeys';
import { loadFile } from './utils/fileLoader';
import { saveAs } from './utils/fileSaver';
import { useToast } from './components/modals/ToastContainer';
import { useDialog } from './components/modals/DialogContext';
import { get_file_safe_title } from '@story-adventure/shared';
// Override INPUT action to use modal prompt()
import { supported_actions } from '@story-adventure/shared';
function App() {
    const toast = useToast();
    const dialog = useDialog();
    const [showHelp, setShowHelp] = useState(false);
    const [textVisible, setTextVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
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
    const { story, currentSectionId, viewerState, isLoading: playerLoading, loadStory, loadSection, oneStepForward, oneStepBack, getCurrentSection, getCurrentSectionText, getCurrentChoices, } = useStoryPlayer();
    // Load story from file
    const handleLoadFile = useCallback(async () => {
        try {
            setIsLoading(true);
            const content = await loadFile();
            try {
                const storyData = JSON.parse(content);
                loadStory(storyData);
                toast.toastOk('Story Adventure Loaded');
                toast.toastInfo("Press '?' to display the viewer help.");
            }
            catch (error) {
                toast.toastAlert('Not a valid json');
                console.error(error);
            }
        }
        catch (error) {
            toast.toastAlert('Failed to load file');
            console.error(error);
        }
        finally {
            setIsLoading(false);
        }
    }, [loadStory, toast]);
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
                .then((json) => {
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
        const blob = new Blob([
            JSON.stringify({
                meta: story.meta,
                state: story.state,
            }, null, 2),
        ], {
            type: 'text/json;charset=utf-8',
        });
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
            const saved = JSON.parse(content);
            if (story.meta.title !== saved.meta?.title) {
                toast.toastAlert(`The loaded story is '${story.meta.title}' but the save game is for '${saved.meta?.title}'`);
                return;
            }
            story.state = saved.state;
            loadStory(story);
        }
        catch (error) {
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
        const requestMethod = element
            .requestFullscreen ||
            element
                .webkitRequestFullScreen ||
            element
                .mozRequestFullScreen ||
            element
                .msRequestFullScreen;
        if (requestMethod) {
            requestMethod.call(element);
        }
    }, []);
    // Handle global click (advance if single choice)
    const handleGlobalClick = useCallback((event) => {
        const target = event.target;
        if (target.tagName === 'INPUT' ||
            target.tagName === 'BUTTON' ||
            !currentSectionId) {
            return;
        }
        oneStepForward();
    }, [currentSectionId, oneStepForward]);
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
    return (_jsxs(_Fragment, { children: [_jsx(BackgroundImage, { media: currentSection?.media }), (isLoading || playerLoading) && (_jsx("div", { className: "text-center", style: {
                    position: 'fixed',
                    top: '50vh',
                    width: '100vw',
                }, children: _jsx("div", { className: "spinner-border text-warning", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading..." }) }) })), viewerState === 'MENU' && _jsx(MenuScreen, { onLoadFile: handleLoadFile }), viewerState === 'PLAYING' && (_jsxs(Container, { id: "story_container", style: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    maxWidth: '99vw',
                    position: 'absolute',
                    bottom: '10px',
                    left: 0,
                }, children: [_jsx(StoryPlayer, { text: sectionText, isVisible: textVisible }), _jsx(ChoiceButtons, { choices: choices, onChoiceClick: (next) => loadSection(next.toString()) })] })), _jsx(HelpModal, { show: showHelp, onHide: () => setShowHelp(false), hotkeys: hotkeys })] }));
}
export default App;
