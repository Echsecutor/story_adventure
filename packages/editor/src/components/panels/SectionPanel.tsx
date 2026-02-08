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
  const [targetSectionId, setTargetSectionId] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Update form when selection changes
  useEffect(() => {
    if (selectedNode) {
      const section = selectedNode.data.section;
      setText(section.text_lines?.join('\n') || section.text || '');
      setMediaSrc(section.media?.src || '');
      setTargetSectionId('');
    } else if (selectedEdge && selectedEdge.data) {
      const choice = selectedEdge.data.choice;
      setText(choice.text || '');
      setMediaSrc('');
      setTargetSectionId(selectedEdge.target);
    } else {
      setText('');
      setMediaSrc('');
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
      <div style={{ padding: '20px' }}>
        <p>Select a node or edge to edit</p>
      </div>
    );
  }

  const isEditingSection = !!selectedNode;

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h5>
        {isEditingSection
          ? `Section ${selectedNode.id}`
          : `Choice: ${selectedEdge?.source} → ${selectedEdge?.target}`}
      </h5>

      <Form.Group className="mb-3">
        <Form.Label>
          {isEditingSection ? 'Story Text' : 'Choice Text'}
        </Form.Label>
        <Form.Control
          ref={textAreaRef}
          as="textarea"
          rows={10}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={isEditingSection ? 'Enter story text... (Paste image to add media)' : 'Enter choice text...'}
        />
      </Form.Group>

      {isEditingSection && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Media</Form.Label>
            <div className="d-flex gap-2 mb-2">
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
                  Remove Media
                </Button>
              )}
            </div>
            <Form.Control
              type="text"
              value={mediaSrc}
              onChange={(e) => handleMediaSrcChange(e.target.value)}
              placeholder="Image URL or data URL (or paste image in text area)"
            />
          </Form.Group>

          {mediaSrc && (
            <div className="mb-3">
              <img
                src={mediaSrc}
                alt="Section media"
                style={{ maxHeight: '300px', width: '100%', objectFit: 'contain' }}
              />
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Actions (Script)</Form.Label>
            <ActionEditor
              script={selectedNode.data.section.script}
              availableVariables={availableVariables}
              availableSections={availableSections.map((s) => s.id)}
              onChange={handleScriptChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Add Choice to Section</Form.Label>
            <div className="d-flex gap-2">
              <Form.Select
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
                onClick={handleAddChoice}
                disabled={!targetSectionId}
              >
                Add Choice
              </Button>
            </div>
          </Form.Group>
        </>
      )}

      <Button variant="danger" onClick={onDelete} className="mt-3">
        Delete {isEditingSection ? 'Section' : 'Choice'}
      </Button>
    </div>
  );
}
