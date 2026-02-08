import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Main story display component showing section text.
 */
import { Row, Col } from 'react-bootstrap';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
export function StoryPlayer({ text, isVisible }) {
    if (!isVisible) {
        return null;
    }
    // Convert markdown to HTML and sanitize
    const htmlContent = DOMPurify.sanitize(marked.parse(text, { async: false }));
    return (_jsx(Row, { id: "story", children: _jsx(Col, { id: "story_text", style: { textAlign: 'left' }, dangerouslySetInnerHTML: { __html: htmlContent } }) }));
}
