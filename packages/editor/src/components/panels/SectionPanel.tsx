/**
 * Right sidebar panel for editing selected section or choice.
 */

import { useState, useEffect, useRef } from 'react';
import { Button, Form } from 'react-bootstrap';
import type { Section, Action } from '@story-adventure/shared';
import type { Node, Edge } from '@xyflow/react';
import type { SectionNodeData, ChoiceEdgeData } from '../../utils/storyToFlow.js';
import { ActionEditor } from './ActionEditor.js';
import { handleImagePaste } from '../../utils/mediaHandler.js';
import { loadImageFile } from '../../utils/fileLoader.js';

export interface SectionPanelProps {
  selectedNode: Node<SectionNodeData> | null;
  selectedEdge: Edge<ChoiceEdgeData> | null;
  onUpdateSection: (sectionId: string, updates: Partial<Section>) => void;
  onUpdateChoice: (sourceSectionId: string, targetSectionId: string, text: string) => void;
  onDelete: () => void;
  onAddChoice: (targetSectionId: string) => void;
  availableSections: Section[];
  /** Available story variables for action editor */
  availableVariables: string[];
}

/**
 * Panel component for editing selected section or choice.
 */
export function SectionPanel({
  selectedNode,
  selectedEdge,
  onUpdateSection,
  onUpdateChoice,
  onDelete,
  onAddChoice,
  availableSections,
  availableVariables,
}: SectionPanelProps) {
  const [text, setText] = useState('');
  const [mediaSrc, setMediaSrc] = useState('');
  const [aiExtendable, setAiExtendable] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Update form when selection changes
  useEffect(() => {
    if (selectedNode) {
      const section = selectedNode.data.section;
      setText(section.text_lines?.join('\n') || section.text || '');
      setMediaSrc(section.media?.src || '');
      setAiExtendable(section.ai_extendable ?? false);
      setTargetSectionId('');
    } else if (selectedEdge && selectedEdge.data) {
      const choice = selectedEdge.data.choice;
      setText(choice.text || '');
      setMediaSrc('');
      setAiExtendable(false);
      setTargetSectionId(selectedEdge.target);
    } else {
      setText('');
      setMediaSrc('');
      setAiExtendable(false);
      setTargetSectionId('');
    }
  }, [selectedNode, selectedEdge]);

  // Handle text changes
  const handleTextChange = (newText: string) => {
    setText(newText);
    
    if (selectedNode) {
      onUpdateSection(selectedNode.id, {
        text_lines: newText.split('\n'),
      });
    } else if (selectedEdge) {
      onUpdateChoice(
        selectedEdge.source,
        selectedEdge.target,
        newText
      );
    }
  };

  // Handle media source changes
  const handleMediaSrcChange = (newSrc: string) => {
    setMediaSrc(newSrc);
    
    if (selectedNode) {
      onUpdateSection(selectedNode.id, {
        media: newSrc
          ? {
              type: 'image',
              src: newSrc,
            }
          : undefined,
      });
    }
  };

  // Handle media removal
  const handleRemoveMedia = () => {
    setMediaSrc('');
    if (selectedNode) {
      onUpdateSection(selectedNode.id, {
        media: undefined,
      });
    }
  };

  // Handle load media from file
  const handleLoadMedia = async () => {
    if (!selectedNode) {
      return;
    }
    try {
      const dataUrl = await loadImageFile();
      setMediaSrc(dataUrl);
      onUpdateSection(selectedNode.id, {
        media: {
          type: 'image',
          src: dataUrl,
        },
      });
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  // Handle image paste
  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea || !selectedNode) {
      return;
    }

    const handlePaste = async (event: ClipboardEvent) => {
      const imageDataUrl = await handleImagePaste(event);
      if (imageDataUrl) {
        event.preventDefault();
        setMediaSrc(imageDataUrl);
        onUpdateSection(selectedNode.id, {
          media: {
            type: 'image',
            src: imageDataUrl,
          },
        });
      }
    };

    textArea.addEventListener('paste', handlePaste);
    return () => {
      textArea.removeEventListener('paste', handlePaste);
    };
  }, [selectedNode, onUpdateSection]);

  // Handle script (actions) changes
  const handleScriptChange = (script: Action[]) => {
    if (selectedNode) {
      onUpdateSection(selectedNode.id, {
        script: script.length > 0 ? script : undefined,
      });
    }
  };

  // Handle adding choice
  const handleAddChoice = () => {
    if (selectedNode && targetSectionId) {
      if (targetSectionId === 'new') {
        // onAddChoice will handle creating new section
        onAddChoice('new');
      } else {
        onAddChoice(targetSectionId);
      }
      setTargetSectionId('');
    }
  };

  if (!selectedNode && !selectedEdge) {
    return (
      <div style={{ padding: '12px 20px' }}>
        <p className="text-muted mb-0">Select a node or edge to edit</p>
      </div>
    );
  }

  const isEditingSection = !!selectedNode;

  // Choice editing: simple single-row layout
  if (!isEditingSection) {
    return (
      <div style={{ padding: '12px 20px' }}>
        <div className="d-flex align-items-center gap-3 mb-2">
          <h6 className="mb-0 text-nowrap">
            Choice: {selectedEdge?.source} &rarr; {selectedEdge?.target}
          </h6>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Delete Choice
          </Button>
        </div>
        <Form.Control
          ref={textAreaRef}
          as="textarea"
          rows={3}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter choice text..."
        />
      </div>
    );
  }

  // Section editing: horizontal multi-column layout
  return (
    <div style={{ padding: '12px 20px' }}>
      <div className="d-flex align-items-center gap-3 mb-2">
        <h6 className="mb-0">Section {selectedNode.id}</h6>
        <Button variant="danger" size="sm" onClick={onDelete}>
          Delete Section
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Column 1: Story text */}
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <Form.Group className="mb-2">
            <Form.Label className="small fw-bold mb-1">Story Text</Form.Label>
            <Form.Control
              ref={textAreaRef}
              as="textarea"
              rows={8}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter story text... (Paste image to add media)"
              style={{ resize: 'vertical' }}
            />
          </Form.Group>
        </div>

        {/* Column 2: Media */}
        <div style={{ flex: '0 1 280px', minWidth: '200px' }}>
          <Form.Group className="mb-2">
            <Form.Label className="small fw-bold mb-1">Media</Form.Label>
            <div className="d-flex gap-2 mb-1">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleLoadMedia}
              >
                Load Picture
              </Button>
              {mediaSrc && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleRemoveMedia}
                >
                  Remove
                </Button>
              )}
            </div>
            <Form.Control
              type="text"
              size="sm"
              value={mediaSrc}
              onChange={(e) => handleMediaSrcChange(e.target.value)}
              placeholder="Image URL or data URL"
            />
          </Form.Group>
          {mediaSrc && (
            <div className="mb-2">
              <img
                src={mediaSrc}
                alt="Section media"
                style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>

        {/* Column 3: Actions & Choices */}
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <Form.Group className="mb-2">
            <Form.Label className="small fw-bold mb-1">Actions (Script)</Form.Label>
            <ActionEditor
              script={selectedNode.data.section.script}
              availableVariables={availableVariables}
              availableSections={availableSections.map((s) => s.id)}
              onChange={handleScriptChange}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label className="small fw-bold mb-1">AI Extension</Form.Label>
            <Form.Check
              type="switch"
              id="ai-extendable-check"
              label="AI Extendable"
              title="When enabled, the AI story extension feature in the viewer can automatically generate new story branches from this section using a configured LLM endpoint. The player must opt in and provide their own API credentials."
              checked={aiExtendable}
              onChange={(e) => {
                const checked = e.target.checked;
                setAiExtendable(checked);
                onUpdateSection(selectedNode.id, {
                  ai_extendable: checked || undefined,
                });
              }}
            />
            <Form.Text className="text-muted">
              Allow AI to generate new story branches from this section in the viewer.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label className="small fw-bold mb-1">Add Choice</Form.Label>
            <div className="d-flex gap-2">
              <Form.Select
                size="sm"
                value={targetSectionId}
                onChange={(e) => setTargetSectionId(e.target.value)}
              >
                <option value="">Select target section...</option>
                {availableSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.id}
                  </option>
                ))}
                <option value="new">+ New Section</option>
              </Form.Select>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddChoice}
                disabled={!targetSectionId}
              >
                Add
              </Button>
            </div>
          </Form.Group>
        </div>
      </div>
    </div>
  );
}
