/**
 * Modal component for editing story metadata and configuration.
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Accordion } from 'react-bootstrap';
import type { Story, StoryMeta } from '@story-adventure/shared';

export interface StoryMetadataModalProps {
  /** Current story */
  story: Story;
  /** Whether the modal is shown */
  show: boolean;
  /** Callback to close the modal */
  onHide: () => void;
  /** Callback to update story metadata */
  onUpdateMeta: (meta: StoryMeta) => void;
}

/**
 * Modal for editing story metadata, characters, and starting section.
 */
export function StoryMetadataModal({
  story,
  show,
  onHide,
  onUpdateMeta,
}: StoryMetadataModalProps) {
  // Basic metadata
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorUrl, setAuthorUrl] = useState('');
  const [year, setYear] = useState('');
  const [licenseName, setLicenseName] = useState('');
  const [licenseUrl, setLicenseUrl] = useState('');
  
  // AI configuration
  const [aiGenLookAhead, setAiGenLookAhead] = useState('2');
  const [startingSection, setStartingSection] = useState('');
  
  // Characters (as JSON string for editing)
  const [charactersJson, setCharactersJson] = useState('');
  const [charactersError, setCharactersError] = useState<string | null>(null);

  // Initialize form from story metadata
  useEffect(() => {
    if (story.meta) {
      setTitle(story.meta.title || '');
      setAuthorName(story.meta.author?.name || '');
      setAuthorUrl(story.meta.author?.url || '');
      setYear(story.meta.year || '');
      setLicenseName(story.meta.license?.name || '');
      setLicenseUrl(story.meta.license?.url || '');
      setAiGenLookAhead(String(story.meta.ai_gen_look_ahead ?? 2));
      
      // Format characters as JSON
      if (story.meta.characters) {
        setCharactersJson(JSON.stringify(story.meta.characters, null, 2));
      } else {
        setCharactersJson('{}');
      }
    }
    
    // Set starting section from state or first section
    if (story.state?.current_section) {
      setStartingSection(story.state.current_section);
    } else if (story.sections) {
      const firstSection = Object.keys(story.sections)[0];
      setStartingSection(firstSection || '');
    }
  }, [story, show]);

  // Validate and save metadata
  const handleSave = () => {
    // Parse characters JSON
    let characters: Record<string, string> | undefined = undefined;
    if (charactersJson.trim()) {
      try {
        characters = JSON.parse(charactersJson);
        setCharactersError(null);
      } catch (error) {
        setCharactersError('Invalid JSON format for characters');
        return;
      }
    }

    // Build metadata object
    const meta: StoryMeta = {
      title: title || 'Untitled Story',
      author: authorName ? {
        name: authorName,
        url: authorUrl || undefined,
      } : undefined,
      year: year || undefined,
      license: licenseName ? {
        name: licenseName,
        url: licenseUrl,
      } : undefined,
      ai_gen_look_ahead: parseInt(aiGenLookAhead) || 2,
      characters,
    };

    // Update story state with starting section
    story.state = story.state || {};
    if (startingSection) {
      story.state.current_section = startingSection;
    }

    onUpdateMeta(meta);
    onHide();
  };

  const sectionIds = Object.keys(story.sections || {});

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Story Metadata</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Accordion defaultActiveKey="0">
          <Accordion.Item eventKey="0">
            <Accordion.Header>Basic Information</Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Story title"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Author Name</Form.Label>
                <Form.Control
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Author name"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Author URL</Form.Label>
                <Form.Control
                  type="text"
                  value={authorUrl}
                  onChange={(e) => setAuthorUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Year</Form.Label>
                <Form.Control
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                />
              </Form.Group>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1">
            <Accordion.Header>License</Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Label>License Name</Form.Label>
                <Form.Control
                  type="text"
                  value={licenseName}
                  onChange={(e) => setLicenseName(e.target.value)}
                  placeholder="CC BY 4.0"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>License URL</Form.Label>
                <Form.Control
                  type="text"
                  value={licenseUrl}
                  onChange={(e) => setLicenseUrl(e.target.value)}
                  placeholder="https://creativecommons.org/licenses/by/4.0/"
                />
              </Form.Group>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="2">
            <Accordion.Header>Story Configuration</Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Label>Starting Section</Form.Label>
                <Form.Select
                  value={startingSection}
                  onChange={(e) => setStartingSection(e.target.value)}
                >
                  <option value="">Select starting section...</option>
                  {sectionIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  The section where the story begins. Used for linearization and AI expansion.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>AI Look-Ahead Steps</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="10"
                  value={aiGenLookAhead}
                  onChange={(e) => setAiGenLookAhead(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Number of steps ahead to check for AI-extendable sections in the viewer (default: 2).
                </Form.Text>
              </Form.Group>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="3">
            <Accordion.Header>Characters</Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Label>Character Profiles (JSON)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  value={charactersJson}
                  onChange={(e) => {
                    setCharactersJson(e.target.value);
                    setCharactersError(null);
                  }}
                  placeholder='{\n  "CharacterName": "Description",\n  "Alice": "A curious young girl"\n}'
                  isInvalid={!!charactersError}
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
                <Form.Control.Feedback type="invalid">
                  {charactersError}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Character profiles for consistent AI generation. Format: JSON object with character names as keys.
                </Form.Text>
              </Form.Group>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Metadata
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
