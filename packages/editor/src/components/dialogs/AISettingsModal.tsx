/**
 * Modal component for configuring AI settings (LLM and image generation endpoints).
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Accordion, Spinner, Badge } from 'react-bootstrap';
import {
  getLlmEndpoint,
  setLlmEndpoint,
  getImageGenConfig,
  setImageGenConfig,
  callLlmStreaming,
  type LlmEndpoint,
  type ImageGenConfig,
} from '@story-adventure/shared';

export interface AISettingsModalProps {
  /** Whether the modal is shown */
  show: boolean;
  /** Callback to close the modal */
  onHide: () => void;
}

/**
 * Modal for configuring AI settings including LLM endpoint and image generation.
 */
export function AISettingsModal({ show, onHide }: AISettingsModalProps) {
  // LLM endpoint configuration
  const [llmUrl, setLlmUrl] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [llmType, setLlmType] = useState<'openai' | 'custom'>('openai');

  // Image generation configuration
  const [imageGenUrl, setImageGenUrl] = useState('');
  const [imageGenApiKey, setImageGenApiKey] = useState('');
  const [imageGenModel, setImageGenModel] = useState('');

  // Communication test state
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  // Load current configuration
  useEffect(() => {
    const llmEndpoint = getLlmEndpoint();
    if (llmEndpoint) {
      setLlmUrl(llmEndpoint.url || '');
      setLlmApiKey(llmEndpoint.api_key || '');
      setLlmModel(llmEndpoint.model || '');
      setLlmType(llmEndpoint.type === 'custom' ? 'custom' : 'openai');
    } else {
      // Set default OpenAI endpoint
      setLlmUrl('https://api.openai.com/v1/chat/completions');
      setLlmType('openai');
    }

    const imageConfig = getImageGenConfig();
    if (imageConfig) {
      setImageGenUrl(imageConfig.url || '');
      setImageGenApiKey(imageConfig.api_key || '');
      setImageGenModel(imageConfig.model || '');
    } else {
      // Set default OpenAI image endpoint
      setImageGenUrl('https://api.openai.com/v1/images/generations');
      setImageGenModel('dall-e-3');
    }
  }, [show]);

  // Handle save LLM configuration
  const handleSaveLlm = () => {
    const endpoint: LlmEndpoint = {
      url: llmUrl.trim(),
      api_key: llmApiKey.trim() || undefined,
      model: llmModel.trim() || undefined,
      type: llmType,
    };

    setLlmEndpoint(endpoint);
    // Reset test status when settings change
    setTestStatus('idle');
    setTestError(null);
  };

  // Handle save image generation configuration
  const handleSaveImageGen = () => {
    const config: ImageGenConfig = {
      url: imageGenUrl.trim(),
      api_key: imageGenApiKey.trim() || undefined,
      model: imageGenModel.trim() || undefined,
    };

    setImageGenConfig(config);
  };

  // Test AI communication
  const handleTestCommunication = async () => {
    setTestStatus('testing');
    setTestError(null);

    // Save current configuration first
    handleSaveLlm();

    const endpoint = getLlmEndpoint();
    if (!endpoint || !endpoint.url) {
      setTestStatus('error');
      setTestError('No LLM endpoint configured');
      return;
    }

    try {
      const result = await callLlmStreaming({
        endpoint,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant.',
          },
          {
            role: 'user',
            content: 'Communication test: say hello and return immediately.',
          },
        ],
        timeoutMs: 30000,
      });

      if (result.success) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setTestError(result.error || 'Unknown error');
      }
    } catch (error) {
      setTestStatus('error');
      setTestError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>AI Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Accordion defaultActiveKey="0">
          <Accordion.Item eventKey="0">
            <Accordion.Header>LLM Endpoint (Story Extension)</Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Label>Endpoint Type</Form.Label>
                <Form.Select
                  value={llmType}
                  onChange={(e) => setLlmType(e.target.value as 'openai' | 'custom')}
                >
                  <option value="openai">OpenAI-compatible</option>
                  <option value="custom">Custom</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>API Endpoint URL</Form.Label>
                <Form.Control
                  type="text"
                  value={llmUrl}
                  onChange={(e) => {
                    setLlmUrl(e.target.value);
                    setTestStatus('idle');
                  }}
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
                <Form.Text className="text-muted">
                  URL for the LLM chat/completions endpoint
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>API Key</Form.Label>
                <Form.Control
                  type="password"
                  value={llmApiKey}
                  onChange={(e) => {
                    setLlmApiKey(e.target.value);
                    setTestStatus('idle');
                  }}
                  placeholder="sk-..."
                />
                <Form.Text className="text-muted">
                  Optional API key for authentication (stored in browser only)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Model</Form.Label>
                <Form.Control
                  type="text"
                  value={llmModel}
                  onChange={(e) => {
                    setLlmModel(e.target.value);
                    setTestStatus('idle');
                  }}
                  placeholder="gpt-4o"
                />
                <Form.Text className="text-muted">
                  Optional model identifier (e.g., gpt-4o, claude-3-opus-20240229)
                </Form.Text>
              </Form.Group>

              <div className="d-flex gap-2 align-items-center mb-3">
                <Button variant="primary" onClick={handleSaveLlm}>
                  Save LLM Configuration
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={handleTestCommunication}
                  disabled={testStatus === 'testing' || !llmUrl.trim()}
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
                    'Test Communication'
                  )}
                </Button>
                {testStatus === 'success' && (
                  <Badge bg="success">✓ Communication successful</Badge>
                )}
                {testStatus === 'error' && (
                  <Badge bg="danger">✗ Communication failed</Badge>
                )}
              </div>

              {testError && (
                <div className="alert alert-danger mb-0">
                  <strong>Error:</strong> {testError}
                </div>
              )}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1">
            <Accordion.Header>Image Generation Endpoint</Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Label>API Endpoint URL</Form.Label>
                <Form.Control
                  type="text"
                  value={imageGenUrl}
                  onChange={(e) => setImageGenUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1/images/generations"
                />
                <Form.Text className="text-muted">
                  URL for the image generation endpoint (OpenAI-compatible)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>API Key</Form.Label>
                <Form.Control
                  type="password"
                  value={imageGenApiKey}
                  onChange={(e) => setImageGenApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <Form.Text className="text-muted">
                  Optional API key for authentication (stored in browser only)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Model</Form.Label>
                <Form.Control
                  type="text"
                  value={imageGenModel}
                  onChange={(e) => setImageGenModel(e.target.value)}
                  placeholder="dall-e-3"
                />
                <Form.Text className="text-muted">
                  Model identifier (e.g., dall-e-3, dall-e-2, grok-2-image)
                </Form.Text>
              </Form.Group>

              <Button variant="primary" onClick={handleSaveImageGen}>
                Save Image Generation Configuration
              </Button>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <div className="mt-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
          <h6>About AI Configuration</h6>
          <p className="mb-2">
            <strong>Security:</strong> All API credentials are stored in your browser's local storage only.
            They are never included in story files or sent anywhere except to the API endpoints you configure.
          </p>
          <p className="mb-0">
            <strong>Story Extension:</strong> The LLM endpoint is used for AI-powered story expansion in the editor.
            When you extend a section with AI, the current story context is sent to your configured LLM to generate
            new content.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
