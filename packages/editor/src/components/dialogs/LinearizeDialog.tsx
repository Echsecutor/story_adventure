/**
 * Dialog for creating linear story exports.
 * Prompts user for start section, end section, and sections to pass through.
 */

import { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import type { Story } from '@story-adventure/shared';
import { downloadLinearStory } from '../../utils/bundle.js';
import { useToast } from '../modals/ToastContainer';

export interface LinearizeDialogProps {
  show: boolean;
  onHide: () => void;
  story: Story;
}

export function LinearizeDialog({ show, onHide, story }: LinearizeDialogProps) {
  const toast = useToast();
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [passingThrough, setPassingThrough] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sectionIds = Object.keys(story.sections);

  const handleGenerate = async () => {
    if (!startAt || !endAt) {
      setError('Please provide both start and end sections');
      return;
    }

    if (!story.sections[startAt]) {
      setError(`Section "${startAt}" does not exist`);
      return;
    }

    if (!story.sections[endAt]) {
      setError(`Section "${endAt}" does not exist`);
      return;
    }

    // Parse passing through sections (comma-separated)
    const passingList = passingThrough
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Validate passing through sections
    for (const passing of passingList) {
      if (!story.sections[passing]) {
        setError(`Section "${passing}" does not exist`);
        return;
      }
    }

    setError(null);

    try {
      await downloadLinearStory(story, startAt, endAt, passingList);
      toast.toastOk('Linear story generated');
      onHide();
      // Reset form
      setStartAt('');
      setEndAt('');
      setPassingThrough('');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error generating linear story';
      setError(errorMessage);
      toast.toastAlert(errorMessage);
    }
  };

  const handleClose = () => {
    setError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create Linear Story</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Start at section:</Form.Label>
            <Form.Select
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            >
              <option value="">Select start section</option>
              {sectionIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Finish at section:</Form.Label>
            <Form.Select
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            >
              <option value="">Select end section</option>
              {sectionIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Sections to pass through (comma-separated, optional):
            </Form.Label>
            <Form.Control
              type="text"
              value={passingThrough}
              onChange={(e) => setPassingThrough(e.target.value)}
              placeholder="e.g., 2, 5, 10"
            />
            <Form.Text className="text-muted">
              Enter section IDs separated by commas. The linear story must visit
              all of these sections.
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleGenerate}>
          Generate Markdown
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
