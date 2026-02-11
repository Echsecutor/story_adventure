/**
 * Settings modal component with all viewer configuration options.
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Accordion, Spinner, Badge, Table, Row, Col } from 'react-bootstrap';
import type { Section, LlmEndpoint } from '@story-adventure/shared';
import { getLlmEndpoint, setLlmEndpoint, getImageGenConfig, setImageGenConfig, type ImageGenConfig } from '../utils/aiPreferences';
import { generateImageDescription } from '../utils/aiImageDescription';
import { callLlmStreaming } from '../utils/aiApiClient';
import { useToast } from './modals/ToastContainer';

interface HotkeyDefinition {
  description: string;
  aliases?: string[];
}

interface SettingsModalProps {
  show: boolean;
  onHide: () => void;
  section: Section | null;
  sectionId: string | null;
  onSavePrompt: (sectionId: string, prompt: string) => void;
  onLoadFile: () => void;
  onSaveStory: () => void;
  hasStory: boolean;
  aiExpansionEnabled: boolean;
  onAiExpansionToggle: (enabled: boolean) => void;
  imageGenEnabled: boolean;
  onImageGenToggle: (enabled: boolean) => void;
  onGenerateImage?: (sectionId: string, prompt: string) => void;
  hotkeys: Record<string, HotkeyDefinition>;
}

export function SettingsModal({
  show,
  onHide,
  section,
  sectionId,
  onSavePrompt,
  onLoadFile,
  onSaveStory,
  hasStory,
  aiExpansionEnabled,
  onAiExpansionToggle,
  imageGenEnabled,
  onImageGenToggle,
  onGenerateImage,
  hotkeys,
}: SettingsModalProps) {
  const toast = useToast();
  
  // Image description state
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // AI settings state
  const [llmUrl, setLlmUrl] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [llmType, setLlmType] = useState('openai');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');

  // Image generation settings state
  const [imageGenUrl, setImageGenUrl] = useState('');
  const [imageGenApiKey, setImageGenApiKey] = useState('');
  const [imageGenModel, setImageGenModel] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Load LLM endpoint config from localStorage on mount
  useEffect(() => {
    const endpoint = getLlmEndpoint();
    if (endpoint) {
      setLlmUrl(endpoint.url || '');
      setLlmApiKey(endpoint.api_key || '');
      setLlmModel(endpoint.model || '');
      setLlmType(endpoint.type || 'openai');
    }

    const imageGenConfig = getImageGenConfig();
    if (imageGenConfig) {
      setImageGenUrl(imageGenConfig.url || '');
      setImageGenApiKey(imageGenConfig.api_key || '');
      setImageGenModel(imageGenConfig.model || '');
    }
  }, []);

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

  // Save LLM endpoint config to localStorage
  const handleSaveLlmConfig = (showFeedback = false) => {
    try {
      const endpoint: LlmEndpoint = {
        url: llmUrl.trim(),
        api_key: llmApiKey.trim() || undefined,
        model: llmModel.trim() || undefined,
        type: llmType || undefined,
      };
      setLlmEndpoint(endpoint);
      if (showFeedback) {
        toast.toastOk('LLM configuration saved.');
      }
    } catch (error) {
      toast.toastAlert(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Auto-save when fields change (debounced by onChange)
  const handleFieldChange = (
    field: 'url' | 'apiKey' | 'model' | 'type',
    value: string
  ) => {
    if (field === 'url') setLlmUrl(value);
    else if (field === 'apiKey') setLlmApiKey(value);
    else if (field === 'model') setLlmModel(value);
    else if (field === 'type') setLlmType(value);

    // Save after a short delay to avoid saving on every keystroke
    setTimeout(() => handleSaveLlmConfig(), 500);
    
    // Reset test status when settings change
    setTestStatus('idle');
  };

  // Test AI communication with current settings
  const handleTestCommunication = async () => {
    setTestStatus('testing');
    
    try {
      const endpoint = getLlmEndpoint();
      if (!endpoint || !endpoint.url) {
        toast.toastAlert('Please configure LLM endpoint URL first');
        setTestStatus('fail');
        return;
      }

      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: 'Communication test: say hello and return immediately.' }
      ];

      const response = await callLlmStreaming({
        endpoint,
        messages,
        timeoutMs: 30000, // 30 second timeout for test
      });

      if (response.success && response.content) {
        console.log('[Test AI Communication] Success:', response.content);
        toast.toastOk('AI communication test successful!');
        setTestStatus('success');
      } else {
        console.error('[Test AI Communication] Failed:', response.error);
        toast.toastAlert(`Test failed: ${response.error || 'Unknown error'}`);
        setTestStatus('fail');
      }
    } catch (error) {
      console.error('[Test AI Communication] Error:', error);
      toast.toastAlert(`Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTestStatus('fail');
    }
  };

  // Save image generation config to localStorage
  const handleSaveImageGenConfig = (showFeedback = false) => {
    try {
      const config: ImageGenConfig = {
        url: imageGenUrl.trim(),
        api_key: imageGenApiKey.trim() || undefined,
        model: imageGenModel.trim() || undefined,
      };
      setImageGenConfig(config);
      if (showFeedback) {
        toast.toastOk('Image generation configuration saved.');
      }
    } catch (error) {
      toast.toastAlert(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Auto-save when image gen fields change
  const handleImageGenFieldChange = (
    field: 'url' | 'apiKey' | 'model',
    value: string
  ) => {
    if (field === 'url') setImageGenUrl(value);
    else if (field === 'apiKey') setImageGenApiKey(value);
    else if (field === 'model') setImageGenModel(value);

    // Save after a short delay to avoid saving on every keystroke
    setTimeout(() => handleSaveImageGenConfig(), 500);
  };

  // Handle generating image from modal
  const handleGenerateImageFromModal = async () => {
    if (!section?.ai_gen?.prompt || !sectionId || !onGenerateImage) {
      return;
    }

    setIsGeneratingImage(true);
    try {
      await onGenerateImage(sectionId, section.ai_gen.prompt);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const hasImageInfo = section?.ai_gen;
  const hasImage = section?.media?.type === 'image';

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl"
      id="settings_modal"
      tabIndex={-1}
      aria-labelledby="settings_modal_label"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title id="settings_modal_label">Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Accordion>
          {/* Image Information Section - Only show when viewing an image */}
          {hasImage && (
            <Accordion.Item eventKey="0">
              <Accordion.Header>Image Information</Accordion.Header>
              <Accordion.Body>
                {!hasImageInfo && !generatedDescription && (
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

                {hasImageInfo && (
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

                    {imageGenEnabled && onGenerateImage && (
                      <div className="mb-3">
                        <Button
                          variant="success"
                          onClick={handleGenerateImageFromModal}
                          disabled={isGeneratingImage}
                          size="sm"
                        >
                          {isGeneratingImage ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Generating Image...
                            </>
                          ) : (
                            hasImage ? 'Regenerate Image' : 'Generate Image'
                          )}
                        </Button>
                        <Form.Text className="text-muted d-block mt-1">
                          {hasImage 
                            ? 'Generate a new image using the prompt above (replaces current image)' 
                            : 'Generate an image using the prompt above'}
                        </Form.Text>
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
              </Accordion.Body>
            </Accordion.Item>
          )}

          {/* Story Management Section */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>Story Management</Accordion.Header>
            <Accordion.Body>
              <Row className="mb-3">
                <Col>
                  <Button type="button" variant="success" onClick={onLoadFile} className="w-100">
                    Load a Story Adventure
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={onSaveStory} 
                    disabled={!hasStory}
                    className="w-100"
                  >
                    Save Story
                  </Button>
                  {!hasStory && (
                    <small className="text-muted d-block mt-1">
                      No story loaded
                    </small>
                  )}
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>

          {/* AI Settings Section */}
          <Accordion.Item eventKey="2">
            <Accordion.Header>AI Story Expansion Settings</Accordion.Header>
            <Accordion.Body>
              <Form.Check
                type="switch"
                id="ai-expansion-toggle"
                label={
                  <span>
                    AI Story Expansion:{' '}
                    <strong>{aiExpansionEnabled ? 'Enabled' : 'Disabled'}</strong>
                  </span>
                }
                checked={aiExpansionEnabled}
                onChange={(e) => onAiExpansionToggle(e.target.checked)}
                className="mb-3"
              />
              <small className="text-muted d-block mb-3">
                When enabled, stories with AI-extendable sections will dynamically
                generate new content using the LLM endpoint configured below.
              </small>

              <Form.Group className="mb-3">
                <Form.Label>LLM Endpoint URL</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="https://api.openai.com/v1/chat/completions"
                  value={llmUrl}
                  onChange={(e) => handleFieldChange('url', e.target.value)}
                />
                <Form.Text className="text-muted">
                  OpenAI-compatible chat completions endpoint
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>API Key</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="sk-..."
                  value={llmApiKey}
                  onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                />
                <Form.Text className="text-muted">
                  Your API key (stored locally in browser, never shared)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Model (optional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="gpt-4o"
                  value={llmModel}
                  onChange={(e) => handleFieldChange('model', e.target.value)}
                />
                <Form.Text className="text-muted">
                  Leave empty to use server default
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Endpoint Type</Form.Label>
                <Form.Select
                  value={llmType}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                >
                  <option value="openai">OpenAI</option>
                  <option value="custom">Custom (OpenAI-compatible)</option>
                </Form.Select>
              </Form.Group>

              <div className="d-flex gap-2 align-items-center">
                <Button variant="primary" size="sm" onClick={() => handleSaveLlmConfig(true)}>
                  Save Configuration
                </Button>
                
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleTestCommunication}
                  disabled={testStatus === 'testing'}
                >
                  {testStatus === 'testing' ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Testing...
                    </>
                  ) : (
                    'Test AI Communication'
                  )}
                </Button>
                
                {testStatus === 'success' && (
                  <Badge bg="success">Success</Badge>
                )}
                {testStatus === 'fail' && (
                  <Badge bg="danger">Failed</Badge>
                )}
              </div>
            </Accordion.Body>
          </Accordion.Item>

          {/* AI Image Generation Settings Section */}
          <Accordion.Item eventKey="3">
            <Accordion.Header>AI Image Generation Settings</Accordion.Header>
            <Accordion.Body>
              <Form.Check
                type="switch"
                id="image-gen-toggle"
                label={
                  <span>
                    AI Image Generation:{' '}
                    <strong>{imageGenEnabled ? 'Enabled' : 'Disabled'}</strong>
                  </span>
                }
                checked={imageGenEnabled}
                onChange={(e) => onImageGenToggle(e.target.checked)}
                className="mb-3"
              />
              <small className="text-muted d-block mb-3">
                When enabled, sections with image generation prompts can automatically
                generate images using the image generation endpoint configured below.
              </small>

              <Form.Group className="mb-3">
                <Form.Label>Image Generation Endpoint URL</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="https://api.eecc.ai/v1/images/generations"
                  value={imageGenUrl}
                  onChange={(e) => handleImageGenFieldChange('url', e.target.value)}
                />
                <Form.Text className="text-muted">
                  OpenAI-compatible image generation endpoint
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>API Key</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Bearer token..."
                  value={imageGenApiKey}
                  onChange={(e) => handleImageGenFieldChange('apiKey', e.target.value)}
                />
                <Form.Text className="text-muted">
                  Your API key (stored locally in browser, never shared)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Model</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="dall-e-3"
                  value={imageGenModel}
                  onChange={(e) => handleImageGenFieldChange('model', e.target.value)}
                />
                <Form.Text className="text-muted">
                  Model to use for image generation (defaults to dall-e-3 if empty)
                </Form.Text>
              </Form.Group>

              <Button variant="primary" size="sm" onClick={() => handleSaveImageGenConfig(true)}>
                Save Configuration
              </Button>
            </Accordion.Body>
          </Accordion.Item>

          {/* Hotkeys Reference Section */}
          <Accordion.Item eventKey="4">
            <Accordion.Header>Keyboard Shortcuts</Accordion.Header>
            <Accordion.Body>
              <p>Use the following hotkeys anywhere in the viewer:</p>
              <Table>
                <thead>
                  <tr>
                    <th scope="col">Key</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(hotkeys).map(([key, def]) => {
                    const keys = [key, ...(def.aliases || [])];
                    return (
                      <tr key={key}>
                        <td>
                          <strong>{keys.join(', ')}</strong>
                        </td>
                        <td>{def.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
