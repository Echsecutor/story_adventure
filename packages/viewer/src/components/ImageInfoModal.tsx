/**
 * Modal component for displaying image metadata and generating image descriptions.
 */

import { useState } from 'react';
import { Modal, Button, Badge, Spinner } from 'react-bootstrap';
import type { Section } from '@story-adventure/shared';
import { getLlmEndpoint } from '../utils/aiPreferences';
import { generateImageDescription } from '../utils/aiImageDescription';
import { useToast } from './modals/ToastContainer';

interface ImageInfoModalProps {
  show: boolean;
  onHide: () => void;
  section: Section | null;
  sectionId: string | null;
  onSavePrompt: (sectionId: string, prompt: string) => void;
}

export function ImageInfoModal({ show, onHide, section, sectionId, onSavePrompt }: ImageInfoModalProps) {
  const toast = useToast();
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Reset generated description when modal is closed
  const handleClose = () => {
    setGeneratedDescription(null);
    setIsGenerating(false);
    setIsSaved(false);
    onHide();
  };

  // Generate image description
  const handleGenerateDescription = async () => {
    if (!section?.media?.src) {
      toast.toastAlert('No image available');
      return;
    }

    const endpoint = getLlmEndpoint();
    if (!endpoint || !endpoint.url) {
      toast.toastAlert('Please configure LLM endpoint in AI settings');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateImageDescription({
        endpoint,
        imageUrl: section.media.src,
      });

      if (result.success && result.description) {
        setGeneratedDescription(result.description);
        setIsSaved(false);
        toast.toastOk('Image generation prompt created');
      } else {
        toast.toastAlert(`Failed to generate prompt: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.toastAlert(
        `Error generating prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated prompt to section
  const handleSavePrompt = () => {
    if (!generatedDescription || !sectionId) {
      return;
    }
    onSavePrompt(sectionId, generatedDescription);
    setIsSaved(true);
  };

  const hasImageInfo = section?.ai_gen;
  const hasImage = section?.media?.type === 'image';

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      id="image_info_modal"
      tabIndex={-1}
      aria-labelledby="image_info_modal_label"
    >
      <Modal.Header closeButton>
        <Modal.Title id="image_info_modal_label">Image Information</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!hasImage && (
          <p className="text-muted">No image in current section.</p>
        )}

        {hasImage && !hasImageInfo && !generatedDescription && (
          <div>
            <p className="text-muted">
              No image metadata available for this section.
            </p>
            <p>
              You can generate an image generation prompt by analyzing this image with AI:
            </p>
            <Button
              variant="primary"
              onClick={handleGenerateDescription}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Generating...
                </>
              ) : (
                'Generate Image Prompt'
              )}
            </Button>
          </div>
        )}

        {hasImage && hasImageInfo && (
          <div>
            <h5>Generation Metadata</h5>
            
            <div className="mb-3">
              <strong>Generation Prompt:</strong>
              <p className="mt-1 p-2 bg-light border rounded">
                {section.ai_gen!.prompt}
              </p>
            </div>

            {section.ai_gen!.negative_prompt && (
              <div className="mb-3">
                <strong>Negative Prompt:</strong>
                <p className="mt-1 p-2 bg-light border rounded">
                  {section.ai_gen!.negative_prompt}
                </p>
              </div>
            )}

            {section.ai_gen!.size && (
              <div className="mb-3">
                <strong>Size:</strong>{' '}
                <Badge bg="secondary">{section.ai_gen!.size}</Badge>
              </div>
            )}

            <hr />

            <p className="text-muted">
              You can also generate an image generation prompt by analyzing what's actually shown in the image:
            </p>
            <Button
              variant="outline-primary"
              onClick={handleGenerateDescription}
              disabled={isGenerating}
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Generating...
                </>
              ) : (
                'Generate Image Prompt from Visual Analysis'
              )}
            </Button>
          </div>
        )}

        {generatedDescription && (
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Generated Image Prompt</h5>
              {!isSaved ? (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleSavePrompt}
                >
                  Save to Section
                </Button>
              ) : (
                <Badge bg="success">✓ Saved</Badge>
              )}
            </div>
            <div className="p-3 bg-light border rounded">
              {generatedDescription}
            </div>
            {!isSaved && (
              <small className="text-muted d-block mt-2">
                Click "Save to Section" to store this prompt in the story's ai_gen metadata.
              </small>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
