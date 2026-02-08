import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Main App component managing editor state and coordination.
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { get_story, save_story } from '@story-adventure/shared';
import { Navbar } from './components/Navbar.js';
import { GraphEditor } from './components/GraphEditor.js';
import { SectionPanel } from './components/panels/SectionPanel.js';
import { VariablesPanel } from './components/panels/VariablesPanel.js';
import { StoryJsonModal } from './components/dialogs/StoryJsonModal.js';
import { LinearizeDialog } from './components/dialogs/LinearizeDialog.js';
import { useStoryState } from './hooks/useStoryState.js';
import { useAutoSave } from './hooks/useAutoSave.js';
import { useHotkeys } from './hooks/useHotkeys.js';
import { storyToFlow } from './utils/storyToFlow.js';
// import { syncEdgesToStory } from './utils/flowToStory.js'; // Not used in Phase 3
import { loadFile, loadImageFile } from './utils/fileLoader.js';
import { useToast } from './components/modals/ToastContainer';
import { downloadAsIs, downloadGraphInOne, downloadGraphSplit, } from './utils/bundle.js';
const CURRENT_EDITOR_STORY_KEY = 'current_editor_story';
function App() {
    const toast = useToast();
    const { story, loadStory, newStory, addSection, updateSection, deleteSection, addChoice, deleteChoice, updateChoice, setVariables, } = useStoryState();
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [needsRedraw, setNeedsRedraw] = useState(0);
    const [showVariablesPanel, setShowVariablesPanel] = useState(false);
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [showLinearizeDialog, setShowLinearizeDialog] = useState(false);
    // Auto-save every 30 seconds
    useAutoSave(story);
    // Convert story to React Flow format
    const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
        return storyToFlow(story);
    }, [story, needsRedraw]);
    // Load story from IndexedDB on mount
    useEffect(() => {
        get_story(CURRENT_EDITOR_STORY_KEY)
            .then((savedStory) => {
            if (savedStory) {
                loadStory(savedStory);
                toast.toastOk('Loaded saved story');
            }
        })
            .catch((error) => {
            console.error('Failed to load saved story:', error);
        });
    }, [loadStory, toast]);
    // Handle node click
    const handleNodeClick = useCallback((_event, node) => {
        setSelectedNode(node);
        setSelectedEdge(null);
    }, []);
    // Handle edge click
    const handleEdgeClick = useCallback((_event, edge) => {
        setSelectedEdge(edge);
        setSelectedNode(null);
    }, []);
    // Handle new story
    const handleNewStory = useCallback(() => {
        newStory();
        setSelectedNode(null);
        setSelectedEdge(null);
        setNeedsRedraw((n) => n + 1);
        toast.toastOk('Created new story');
    }, [newStory, toast]);
    // Handle load story
    const handleLoadStory = useCallback(async () => {
        try {
            const content = await loadFile();
            const loadedStory = JSON.parse(content);
            loadStory(loadedStory);
            setSelectedNode(null);
            setSelectedEdge(null);
            setNeedsRedraw((n) => n + 1);
            toast.toastOk('Story loaded');
        }
        catch (error) {
            toast.toastAlert(`Error loading story: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [loadStory, toast]);
    // Handle save story
    const handleSaveStory = useCallback(async () => {
        try {
            await save_story(CURRENT_EDITOR_STORY_KEY, story);
            await downloadAsIs(story);
            toast.toastOk('Story saved');
        }
        catch (error) {
            toast.toastAlert(`Error saving story: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [story, toast]);
    // Handle save story with embedded images
    const handleSaveStoryWithImages = useCallback(async () => {
        try {
            toast.toastInfo('Downloading all external picture references...');
            await downloadGraphInOne(story);
            toast.toastOk('All pictures embedded. Story downloaded.');
        }
        catch (error) {
            toast.toastAlert(`Error saving story with images: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [story, toast]);
    // Handle generate bundle
    const handleGenerateBundle = useCallback(async () => {
        try {
            toast.toastInfo('Extracting images into separate files');
            await downloadGraphSplit(story);
            toast.toastOk('Bundle generated');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error generating bundle';
            toast.toastAlert(errorMessage);
        }
    }, [story, toast]);
    // Handle add section
    const handleAddSection = useCallback(() => {
        const newSectionId = addSection();
        setNeedsRedraw((n) => n + 1);
        toast.toastOk(`Added section ${newSectionId}`);
    }, [addSection, toast]);
    // Handle redraw
    const handleRedraw = useCallback(() => {
        setNeedsRedraw((n) => n + 1);
    }, []);
    // Handle update section
    const handleUpdateSection = useCallback((sectionId, updates) => {
        updateSection(sectionId, updates);
    }, [updateSection]);
    // Handle update choice
    const handleUpdateChoice = useCallback((sourceSectionId, targetSectionId, text) => {
        updateChoice(sourceSectionId, targetSectionId, text);
        setNeedsRedraw((n) => n + 1);
    }, [updateChoice]);
    // Handle delete
    const handleDelete = useCallback(() => {
        if (selectedNode) {
            deleteSection(selectedNode.id);
            setSelectedNode(null);
            setNeedsRedraw((n) => n + 1);
            toast.toastOk('Section deleted');
        }
        else if (selectedEdge) {
            deleteChoice(selectedEdge.source, selectedEdge.target);
            setSelectedEdge(null);
            setNeedsRedraw((n) => n + 1);
            toast.toastOk('Choice deleted');
        }
    }, [selectedNode, selectedEdge, deleteSection, deleteChoice, toast]);
    // Handle add choice
    const handleAddChoice = useCallback((targetSectionId) => {
        if (selectedNode) {
            let actualTargetId = targetSectionId;
            if (targetSectionId === 'new') {
                actualTargetId = addSection();
            }
            addChoice(selectedNode.id, actualTargetId, '');
            setNeedsRedraw((n) => n + 1);
            toast.toastOk('Choice added');
        }
    }, [selectedNode, addSection, addChoice, toast]);
    // Handle connect (dragging edge)
    const handleConnect = useCallback((connection) => {
        if (connection.source && connection.target) {
            addChoice(connection.source, connection.target, '');
            setNeedsRedraw((n) => n + 1);
        }
    }, [addChoice]);
    // Handle load media
    const handleLoadMedia = useCallback(async () => {
        if (!selectedNode) {
            toast.toastAlert('Please select a section to add media to');
            return;
        }
        try {
            const dataUrl = await loadImageFile();
            updateSection(selectedNode.id, {
                media: {
                    type: 'image',
                    src: dataUrl,
                },
            });
            toast.toastOk('Media loaded');
        }
        catch (error) {
            toast.toastAlert(`Error loading media: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [selectedNode, updateSection, toast]);
    // Keyboard shortcuts
    useHotkeys({
        onAddSection: handleAddSection,
        onLoadMedia: handleLoadMedia,
    }, {
        story,
        selectedSectionId: selectedNode?.id || null,
        onSelectSection: (sectionId) => {
            const node = flowNodes.find((n) => n.id === sectionId);
            if (node) {
                handleNodeClick({}, node);
            }
        },
    });
    // Get available sections for dropdown
    const availableSections = useMemo(() => {
        return Object.values(story.sections);
    }, [story.sections]);
    // Get available variables for action editor
    const availableVariables = useMemo(() => {
        return Object.keys(story.state?.variables || {});
    }, [story.state?.variables]);
    // Handle variables change
    const handleVariablesChange = useCallback((variables) => {
        setVariables(variables);
    }, [setVariables]);
    return (_jsxs("div", { children: [_jsx(Navbar, { onNewStory: handleNewStory, onLoadStory: handleLoadStory, onSaveStory: handleSaveStory, onSaveStoryWithImages: handleSaveStoryWithImages, onGenerateBundle: handleGenerateBundle, onCreateLinearStory: () => setShowLinearizeDialog(true), onAddSection: handleAddSection, onRedraw: handleRedraw, onShowVariables: () => setShowVariablesPanel(true), onShowJson: () => setShowJsonModal(true) }), _jsx(Container, { fluid: true, children: _jsxs(Row, { children: [_jsx(Col, { xs: 12, md: selectedNode || selectedEdge ? 8 : 12, children: _jsx(GraphEditor, { nodes: flowNodes, edges: flowEdges, onNodeClick: handleNodeClick, onEdgeClick: handleEdgeClick, onConnect: handleConnect, onNodesChange: () => { }, onEdgesChange: () => { } }) }), (selectedNode || selectedEdge) && (_jsx(Col, { xs: 12, md: 4, children: _jsx(SectionPanel, { selectedNode: selectedNode, selectedEdge: selectedEdge, onUpdateSection: handleUpdateSection, onUpdateChoice: handleUpdateChoice, onDelete: handleDelete, onAddChoice: handleAddChoice, availableSections: availableSections, availableVariables: availableVariables }) }))] }) }), _jsx(VariablesPanel, { variables: story.state?.variables || {}, onChange: handleVariablesChange, show: showVariablesPanel, onHide: () => setShowVariablesPanel(false) }), _jsx(StoryJsonModal, { story: story, show: showJsonModal, onHide: () => setShowJsonModal(false) }), _jsx(LinearizeDialog, { story: story, show: showLinearizeDialog, onHide: () => setShowLinearizeDialog(false) })] }));
}
export default App;
