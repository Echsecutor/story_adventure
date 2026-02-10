/**
 * Menu screen component displayed when no story is loaded.
 */

import { useState, useEffect } from 'react';
import { Button, Container, Row, Col, Form, Accordion } from 'react-bootstrap';
import type { LlmEndpoint } from '@story-adventure/shared';
import { getLlmEndpoint, setLlmEndpoint } from '../utils/aiPreferences';
import { useToast } from './modals/ToastContainer';

interface MenuScreenProps {
  onLoadFile: () => void;
  aiExpansionEnabled: boolean;
  onAiExpansionToggle: (enabled: boolean) => void;
}

export function MenuScreen({
  onLoadFile,
  aiExpansionEnabled,
  onAiExpansionToggle,
}: MenuScreenProps) {
  const toast = useToast();
  const [llmUrl, setLlmUrl] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [llmType, setLlmType] = useState('openai');

  // Load LLM endpoint config from localStorage on mount
  useEffect(() => {
    const endpoint = getLlmEndpoint();
    if (endpoint) {
      setLlmUrl(endpoint.url || '');
      setLlmApiKey(endpoint.api_key || '');
      setLlmModel(endpoint.model || '');
      setLlmType(endpoint.type || 'openai');
    }
  }, []);

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
  };

  return (
    <Container id="menu_container" style={{ position: 'relative', top: '15vh' }}>
      <Row>
        <Col>
          <h1>Story Adventure Viewer</h1>
          <p>
            This is the viewer of{' '}
            <a
              href="https://github.com/Echsecutor/story_adventure"
              target="_blank"
              rel="noreferrer"
            >
              the open source story adventure tools
            </a>
            . See there for copyright, license information and please{' '}
            <a
              href="https://github.com/Echsecutor/story_adventure/issues"
              target="_blank"
              rel="noreferrer"
            >
              open issues
            </a>{' '}
            to report bugs or request features.
          </p>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Button type="button" variant="success" onClick={onLoadFile}>
            Load a Story Adventure
          </Button>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Accordion>
            <Accordion.Item eventKey="0">
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

                <Button variant="primary" size="sm" onClick={() => handleSaveLlmConfig(true)}>
                  Save Configuration
                </Button>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Col>
      </Row>
      <Row>
        <Col>Press &quot;?&quot; to display the viewer help.</Col>
      </Row>
    </Container>
  );
}
