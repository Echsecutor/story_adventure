/**
 * Modal component for displaying the current story JSON.
 */

import { Modal, Button } from 'react-bootstrap';
import type { Story } from '@story-adventure/shared';

export interface StoryJsonModalProps {
  /** Current story to display */
  story: Story;
  /** Whether the modal is shown */
  show: boolean;
  /** Callback to close the modal */
  onHide: () => void;
}

/**
 * Modal displaying formatted story JSON.
 */
export function StoryJsonModal({
  story,
  show,
  onHide,
}: StoryJsonModalProps) {
  const jsonString = JSON.stringify(story, null, 2);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Current Story JSON</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <pre
          style={{
            maxHeight: '70vh',
            overflow: 'auto',
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
          }}
        >
          <code>{jsonString}</code>
        </pre>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
