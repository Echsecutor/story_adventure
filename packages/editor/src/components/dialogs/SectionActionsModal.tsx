/**
 * Modal component for editing section actions, AI settings, and choices.
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Accordion, Spinner } from 'react-bootstrap';
import type { Section, Action } from '@story-adventure/shared';
import { ActionEditor } from '../panels/ActionEditor.js';

export interface SectionActionsModalProps {
  /** The section being edited */
  section: Section | null;
  /** Whether the modal is shown */
  show: boolean;
  /** Callback to close the modal */
  onHide: () => void;
  /** Callback to update section */
  onUpdateSection: (sectionId: string, updates: Partial<Section>) => void;
  /** Available sections for choice targets */
  availableSections: Section[];
  /** Available story variables for action editor */
  availableVariables: string[];
  /** Callback to extend section with AI */
  onExtendWithAI?: (sectionId: string) => Promise<void>;
  /** Callback to generate image from prompt */
  onGenerateImage?: (sectionId: string, prompt: string) => Promise<void>;
  /** Callback to derive prompt from existing image */
  onDerivePrompt?: (sectionId: string, imageUrl: string) => Promise<string | null>;
  /** Whether AI operations are in progress */
  isAIProcessing?: boolean;
}

/**
 * Modal for managing section actions, AI settings, and choices.
 */
export function SectionActionsModal({
  section,
  show,
  onHide,
  onUpdateSection,
  availableSections,
  availableVariables,
  onExtendWithAI,
  onGenerateImage,
  onDerivePrompt,
  isAIProcessing = false,
}: SectionActionsModalProps) {
  const [aiExtendable, setAiExtendable] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isDerivedPrompt, setIsDerivedPrompt] = useState(false);

  // Initialize form from section
  useEffect(() => {
    if (section) {
      setAiExtendable(section.ai_extendable ?? false);
      setAiPrompt(section.ai_gen?.prompt || '');
    } else {
      setAiExtendable(false);
      setAiPrompt('');
    }
  }, [section, show]);

  // Handle script (actions) changes
  const handleScriptChange = (script: Action[]) => {
    if (section) {
      onUpdateSection(section.id, {
        script: script.length > 0 ? script : undefined,
      });
    }
  };

  // Handle AI extendable toggle
  const handleAiExtendableChange = (checked: boolean) => {
    setAiExtendable(checked);
    if (section) {
      onUpdateSection(section.id, {
        ai_extendable: checked || undefined,
      });
    }
  };

  // Handle AI prompt change
  const handleAiPromptChange = (newPrompt: string) => {
    setAiPrompt(newPrompt);
    if (section) {
      onUpdateSection(section.id, {
        ai_gen: newPrompt.trim()
          ? {
              prompt: newPrompt.trim(),
              ...section.ai_gen,
            }
          : undefined,
      });
    }
  };

  // Handle extend with AI
  const handleExtendWithAI = async () => {
    if (section && onExtendWithAI) {
      await onExtendWithAI(section.id);
    }
  };

  // Handle generate image
  const handleGenerateImage = async () => {
    if (section && onGenerateImage && aiPrompt.trim()) {
      await onGenerateImage(section.id, aiPrompt.trim());
    }
  };

  // Handle derive prompt from image
  const handleDerivePrompt = async () => {
    if (section && section.media?.src && onDerivePrompt) {
      setIsDerivedPrompt(true);
      const derivedPrompt = await onDerivePrompt(section.id, section.media.src);
      setIsDerivedPrompt(false);
      if (derivedPrompt) {
        setAiPrompt(derivedPrompt);
        handleAiPromptChange(derivedPrompt);
      }
    }
  };

  if (!section) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Section {section.id} - Actions & AI</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Accordion defaultActiveKey="0">
          <Accordion.Item eventKey="0">
            <Accordion.Header>Actions (Script)</Accordion.Header>
            <Accordion.Body>
              <ActionEditor
                script={section.script}
                availableVariables={availableVariables}
                availableSections={availableSections.map((s) => s.id)}
                onChange={handleScriptChange}
              />
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1">
            <Accordion.Header>AI Settings</Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="ai-extendable-check"
                  label="AI Extendable"
                  title="When enabled, the AI story extension feature can automatically generate new story branches from this section in both editor and viewer."
                  checked={aiExtendable}
                  onChange={(e) => handleAiExtendableChange(e.target.checked)}
                />
                <Form.Text className="text-muted">
                  Allow AI to generate new story branches from this section.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Image Generation Prompt</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => handleAiPromptChange(e.target.value)}
                  placeholder="Describe the visual scene for AI image generation..."
                />
                <Form.Text className="text-muted">
                  If set, an image can be generated from this prompt using the configured AI image generation endpoint.
                </Form.Text>
              </Form.Group>

              {/* AI feature buttons */}
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="primary"
                  onClick={handleExtendWithAI}
                  disabled={!onExtendWithAI || isAIProcessing}
                >
                  {isAIProcessing ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Processing...
                    </>
                  ) : (
                    'Extend with AI'
                  )}
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={handleGenerateImage}
                  disabled={!onGenerateImage || !aiPrompt.trim() || isAIProcessing}
                >
                  Generate Image
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={handleDerivePrompt}
                  disabled={!onDerivePrompt || !section.media?.src || isDerivedPrompt}
                >
                  {isDerivedPrompt ? 'Deriving...' : 'Derive Prompt from Image'}
                </Button>
              </div>
              <Form.Text className="text-muted d-block mt-2">
                Configure AI endpoints in Edit → AI Configuration menu.
              </Form.Text>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
