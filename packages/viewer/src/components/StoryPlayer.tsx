/**
 * Main story display component showing section text.
 */

import { Row, Col } from 'react-bootstrap';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface StoryPlayerProps {
  text: string;
  isVisible: boolean;
}

export function StoryPlayer({ text, isVisible }: StoryPlayerProps) {
  if (!isVisible) {
    return null;
  }

  // Convert markdown to HTML and sanitize
  const htmlContent = DOMPurify.sanitize(marked.parse(text, { async: false }) as string);

  return (
    <Row id="story">
      <Col
        id="story_text"
        style={{ textAlign: 'left' }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </Row>
  );
}
