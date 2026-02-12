/**
 * Main App component managing editor state and coordination.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
// Bootstrap grid imports removed - using flexbox top/bottom layout
import type { Node, Edge, Connection } from '@xyflow/react';
import type { Story } from '@story-adventure/shared';
import {
  get_story,
  save_story,
  getLlmEndpoint,
  hasValidLlmEndpoint,
  getImageGenConfig,
  generateImage,
  generateImageDescription,
  buildPromptMessages,
  callLlmStreaming,
  validateAiStoryUpdate,
} from '@story-adventure/shared';
import { Navbar } from './components/Navbar.js';
import { GraphEditor } from './components/GraphEditor.js';
import { SectionPanel } from './components/panels/SectionPanel.js';
import { VariablesPanel } from './components/panels/VariablesPanel.js';
import { StoryJsonModal } from './components/dialogs/StoryJsonModal.js';
import { LinearizeDialog } from './components/dialogs/LinearizeDialog.js';
import { StoryMetadataModal } from './components/dialogs/StoryMetadataModal.js';
import { AISettingsModal } from './components/dialogs/AISettingsModal.js';
import { SectionActionsModal } from './components/dialogs/SectionActionsModal.js';
import { useStoryState } from './hooks/useStoryState.js';
import { useAutoSave } from './hooks/useAutoSave.js';
import { useHotkeys } from './hooks/useHotkeys.js';
import { storyToFlow } from './utils/storyToFlow.js';
// import { syncEdgesToStory } from './utils/flowToStory.js'; // Not used in Phase 3
import { loadFile, loadImageFile } from './utils/fileLoader.js';
import { useToast } from './components/modals/ToastContainer';
import {
  downloadAsIs,
  downloadGraphInOne,
  downloadGraphSplit,
  depthFirstSearch,
} from './utils/bundle.js';
import type { SectionNodeData, ChoiceEdgeData } from './utils/storyToFlow.js';

const CURRENT_EDITOR_STORY_KEY = 'current_editor_story';

function App() {
  const toast = useToast();
  const {
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
  } = useStoryState();

  const [selectedNode, setSelectedNode] = useState<Node<SectionNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge<ChoiceEdgeData> | null>(null);
  const [needsRedraw, setNeedsRedraw] = useState(0);
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showLinearizeDialog, setShowLinearizeDialog] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showAISettingsModal, setShowAISettingsModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

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
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<SectionNodeData>) => {
      setSelectedNode(node);
      setSelectedEdge(null);
    },
    []
  );

  // Handle edge click
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge<ChoiceEdgeData>) => {
      setSelectedEdge(edge);
      setSelectedNode(null);
    },
    []
  );

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
      const loadedStory = JSON.parse(content) as Story;
      loadStory(loadedStory);
      setSelectedNode(null);
      setSelectedEdge(null);
      setNeedsRedraw((n) => n + 1);
      toast.toastOk('Story loaded');
    } catch (error) {
      toast.toastAlert(`Error loading story: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [loadStory, toast]);

  // Handle save story
  const handleSaveStory = useCallback(async () => {
    try {
      await save_story(CURRENT_EDITOR_STORY_KEY, story);
      await downloadAsIs(story);
      toast.toastOk('Story saved');
    } catch (error) {
      toast.toastAlert(`Error saving story: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [story, toast]);

  // Handle save story with embedded images
  const handleSaveStoryWithImages = useCallback(async () => {
    try {
      toast.toastInfo('Downloading all external picture references...');
      await downloadGraphInOne(story);
      toast.toastOk('All pictures embedded. Story downloaded.');
    } catch (error) {
      toast.toastAlert(`Error saving story with images: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [story, toast]);

  // Handle generate bundle
  const handleGenerateBundle = useCallback(async () => {
    try {
      toast.toastInfo('Extracting images into separate files');
      await downloadGraphSplit(story);
      toast.toastOk('Bundle generated');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error generating bundle';
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
  const handleUpdateSection = useCallback(
    (sectionId: string, updates: Partial<import('@story-adventure/shared').Section>) => {
      updateSection(sectionId, updates);
    },
    [updateSection]
  );

  // Handle update choice
  const handleUpdateChoice = useCallback(
    (sourceSectionId: string, targetSectionId: string, text: string) => {
      updateChoice(sourceSectionId, targetSectionId, text);
      setNeedsRedraw((n) => n + 1);
    },
    [updateChoice]
  );

  // Handle delete
  const handleDelete = useCallback(() => {
    if (selectedNode) {
      deleteSection(selectedNode.id);
      setSelectedNode(null);
      setNeedsRedraw((n) => n + 1);
      toast.toastOk('Section deleted');
    } else if (selectedEdge) {
      deleteChoice(selectedEdge.source, selectedEdge.target);
      setSelectedEdge(null);
      setNeedsRedraw((n) => n + 1);
      toast.toastOk('Choice deleted');
    }
  }, [selectedNode, selectedEdge, deleteSection, deleteChoice, toast]);

  // Handle add choice
  const handleAddChoice = useCallback(
    (targetSectionId: string) => {
      if (selectedNode) {
        let actualTargetId = targetSectionId;
        if (targetSectionId === 'new') {
          actualTargetId = addSection();
        }
        addChoice(selectedNode.id, actualTargetId, '');
        setNeedsRedraw((n) => n + 1);
        toast.toastOk('Choice added');
      }
    },
    [selectedNode, addSection, addChoice, toast]
  );

  // Handle connect (dragging edge)
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addChoice(connection.source, connection.target, '');
        setNeedsRedraw((n) => n + 1);
      }
    },
    [addChoice]
  );

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
    } catch (error) {
      toast.toastAlert(`Error loading media: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [selectedNode, updateSection, toast]);

  // Keyboard shortcuts
  useHotkeys(
    {
      onAddSection: handleAddSection,
      onLoadMedia: handleLoadMedia,
    },
    {
      story,
      selectedSectionId: selectedNode?.id || null,
      onSelectSection: (sectionId: string) => {
        const node = flowNodes.find((n) => n.id === sectionId);
        if (node) {
          handleNodeClick({} as React.MouseEvent, node);
        }
      },
    }
  );

  // Get available sections for dropdown
  const availableSections = useMemo(() => {
    return Object.values(story.sections);
  }, [story.sections]);

  // Get available variables for action editor
  const availableVariables = useMemo(() => {
    return Object.keys(story.state?.variables || {});
  }, [story.state?.variables]);

  // Handle variables change
  const handleVariablesChange = useCallback((variables: Record<string, string>) => {
    setVariables(variables);
  }, [setVariables]);

  // Handle metadata update
  const handleUpdateMetadata = useCallback((meta: import('@story-adventure/shared').StoryMeta) => {
    loadStory({
      ...story,
      meta,
    });
    toast.toastOk('Story metadata updated');
  }, [story, loadStory, toast]);

  // Handle extend section with AI
  const handleExtendWithAI = useCallback(async (sectionId: string) => {
    // Check if starting section is set
    const startingSection = story.state?.current_section;
    if (!startingSection) {
      toast.toastAlert('Please set a starting section in Story Metadata first');
      return;
    }

    // Check if LLM endpoint is configured
    if (!hasValidLlmEndpoint()) {
      toast.toastAlert('Please configure LLM endpoint in AI Configuration');
      return;
    }

    const endpoint = getLlmEndpoint();
    if (!endpoint) {
      toast.toastAlert('No LLM endpoint configured');
      return;
    }

    setIsAIProcessing(true);
    toast.toastInfo('Extending story with AI...');

    try {
      // Create linear story from starting section to current section
      const linearPath = await depthFirstSearch(
        [startingSection],
        sectionId,
        [],
        story
      );

      if (!linearPath) {
        toast.toastAlert(`Could not find path from starting section ${startingSection} to section ${sectionId}`);
        setIsAIProcessing(false);
        return;
      }

      // Get look-ahead value
      const lookAhead = story.meta?.ai_gen_look_ahead || 2;

      // Build prompt messages with the full story (buildPromptMessages handles context extraction)
      const messages = buildPromptMessages(story, sectionId, lookAhead);

      // Call LLM API
      const response = await callLlmStreaming({
        endpoint,
        messages,
        timeoutMs: 120000,
      });

      if (!response.success || !response.content) {
        toast.toastAlert(`AI extension failed: ${response.error || 'Unknown error'}`);
        setIsAIProcessing(false);
        return;
      }

      console.log('[AI Extension] Raw response:', response.content);

      // Validate and merge response
      const validation = validateAiStoryUpdate(story, response.content, sectionId);
      
      if (!validation.valid) {
        toast.toastAlert(`AI response validation failed: ${validation.error || 'Invalid response'}`);
        console.error('[AI Extension] Validation errors:', validation.error);
        setIsAIProcessing(false);
        return;
      }

      if (!validation.story) {
        toast.toastAlert('AI extension failed: No merged story returned');
        setIsAIProcessing(false);
        return;
      }

      // Update story with merged result
      loadStory(validation.story);
      setNeedsRedraw((n) => n + 1);
      
      // Count new sections
      const originalSectionCount = Object.keys(story.sections).length;
      const newSectionCount = Object.keys(validation.story.sections).length - originalSectionCount;
      toast.toastOk(`AI extension successful! Added ${newSectionCount} new sections`);
    } catch (error) {
      toast.toastAlert(
        `Error extending story: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('[AI Extension] Error:', error);
    } finally {
      setIsAIProcessing(false);
    }
  }, [story, loadStory, toast]);

  // Handle generate image from prompt
  const handleGenerateImage = useCallback(async (sectionId: string, prompt: string) => {
    const config = getImageGenConfig();
    if (!config || !config.url) {
      toast.toastAlert('Please configure image generation endpoint in AI Configuration');
      return;
    }

    setIsAIProcessing(true);
    toast.toastInfo('Generating image...');

    try {
      const section = story.sections[sectionId];
      const result = await generateImage({
        config,
        prompt,
        size: section?.ai_gen?.size || '1024x1024',
        timeoutMs: 60000,
      });

      if (result.success && result.imageDataUrl) {
        updateSection(sectionId, {
          media: {
            type: 'image',
            src: result.imageDataUrl,
          },
        });
        toast.toastOk('Image generated successfully!');
      } else {
        toast.toastAlert(`Failed to generate image: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.toastAlert(
        `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsAIProcessing(false);
    }
  }, [story, updateSection, toast]);

  // Handle derive prompt from image
  const handleDerivePrompt = useCallback(async (_sectionId: string, imageUrl: string): Promise<string | null> => {
    const endpoint = getLlmEndpoint();
    if (!endpoint || !endpoint.url) {
      toast.toastAlert('Please configure LLM endpoint in AI Configuration');
      return null;
    }

    toast.toastInfo('Analyzing image to derive prompt...');

    try {
      const result = await generateImageDescription({
        endpoint,
        imageUrl,
        timeoutMs: 60000,
      });

      if (result.success && result.description) {
        toast.toastOk('Image prompt derived successfully!');
        return result.description;
      } else {
        toast.toastAlert(`Failed to derive prompt: ${result.error || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      toast.toastAlert(
        `Error deriving prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return null;
    }
  }, [toast]);

  const hasSelection = !!(selectedNode || selectedEdge);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar
        onNewStory={handleNewStory}
        onLoadStory={handleLoadStory}
        onSaveStory={handleSaveStory}
        onSaveStoryWithImages={handleSaveStoryWithImages}
        onGenerateBundle={handleGenerateBundle}
        onCreateLinearStory={() => setShowLinearizeDialog(true)}
        onAddSection={handleAddSection}
        onRedraw={handleRedraw}
        onShowVariables={() => setShowVariablesPanel(true)}
        onShowJson={() => setShowJsonModal(true)}
        onShowMetadata={() => setShowMetadataModal(true)}
        onShowAISettings={() => setShowAISettingsModal(true)}
      />
      <div style={{ flex: hasSelection ? '1 1 55%' : '1 1 100%', minHeight: 0 }}>
        <GraphEditor
          nodes={flowNodes}
          edges={flowEdges}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onConnect={handleConnect}
          onNodesChange={() => {}}
          onEdgesChange={() => {}}
        />
      </div>
      {hasSelection && (
        <div style={{
          flex: '1 1 45%',
          minHeight: 0,
          borderTop: '2px solid #dee2e6',
          overflowY: 'auto',
          background: '#fff',
        }}>
          <SectionPanel
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onUpdateSection={handleUpdateSection}
            onUpdateChoice={handleUpdateChoice}
            onDelete={handleDelete}
            onShowActions={() => setShowActionsModal(true)}
            onAddChoice={handleAddChoice}
            availableSections={availableSections}
            availableVariables={availableVariables}
          />
        </div>
      )}

      <VariablesPanel
        variables={story.state?.variables || {}}
        onChange={handleVariablesChange}
        show={showVariablesPanel}
        onHide={() => setShowVariablesPanel(false)}
      />

      <StoryJsonModal
        story={story}
        show={showJsonModal}
        onHide={() => setShowJsonModal(false)}
      />

      <LinearizeDialog
        story={story}
        show={showLinearizeDialog}
        onHide={() => setShowLinearizeDialog(false)}
      />

      <StoryMetadataModal
        story={story}
        show={showMetadataModal}
        onHide={() => setShowMetadataModal(false)}
        onUpdateMeta={handleUpdateMetadata}
      />

      <AISettingsModal
        show={showAISettingsModal}
        onHide={() => setShowAISettingsModal(false)}
      />

      <SectionActionsModal
        section={selectedNode?.data.section || null}
        show={showActionsModal}
        onHide={() => setShowActionsModal(false)}
        onUpdateSection={handleUpdateSection}
        availableSections={availableSections}
        availableVariables={availableVariables}
        onExtendWithAI={handleExtendWithAI}
        onGenerateImage={handleGenerateImage}
        onDerivePrompt={handleDerivePrompt}
        isAIProcessing={isAIProcessing}
      />
    </div>
  );
}

export default App;
