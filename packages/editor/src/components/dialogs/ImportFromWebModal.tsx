/**
 * Modal component for importing stories from web URLs.
 * Optimized for civitai.com articles but supports any web page.
 */

import { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

export interface ImportFromWebModalProps {
  /** Whether the modal is shown */
  show: boolean;
  /** Callback to close the modal */
  onHide: () => void;
  /** Callback when import is successful with the URL */
  onImport: (url: string) => Promise<void>;
}

/**
 * Modal for importing story content from web URLs.
 */
export function ImportFromWebModal({
  show,
  onHide,
  onImport,
}: ImportFromWebModalProps) {
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('URL must start with http:// or https://');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      await onImport(url);
      // Close modal on success
      setUrl('');
      setError(null);
      onHide();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setUrl('');
      setError(null);
      onHide();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isImporting) {
      handleImport();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton={!isImporting}>
        <Modal.Title>Import Story From Web</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Website URL</Form.Label>
          <Form.Control
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://civitai.com/articles/..."
            disabled={isImporting}
            autoFocus
          />
          <Form.Text className="text-muted">
            Enter the URL of a web page to import as a story. 
            Optimized for civitai.com articles, but works with most web pages.
          </Form.Text>
        </Form.Group>

        {error && (
          <Alert variant="danger" className="mb-3">
            <strong>Import Failed:</strong> {error}
          </Alert>
        )}

        {isImporting && (
          <Alert variant="info" className="mb-3 d-flex align-items-center">
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Fetching and processing content...</span>
          </Alert>
        )}

        <Alert variant="info" className="mb-0">
          <strong>How it works:</strong>
          <ul className="mb-0 mt-2">
            <li>For <strong>civitai.com articles</strong>: Extracts story content from the article, preserving text blocks and images in order</li>
            <li>For <strong>other websites</strong>: Extracts main content and images from the page</li>
            <li>Creates a linear story with sections connected by empty choices</li>
            <li>Images are linked (not embedded) - use "Save with images" to embed them later</li>
          </ul>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isImporting}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleImport} 
          disabled={isImporting || !url.trim()}
        >
          {isImporting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Importing...
            </>
          ) : (
            'Import'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
