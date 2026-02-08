import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Modal component for displaying the current story JSON.
 */
import { Modal, Button } from 'react-bootstrap';
/**
 * Modal displaying formatted story JSON.
 */
export function StoryJsonModal({ story, show, onHide, }) {
    const jsonString = JSON.stringify(story, null, 2);
    return (_jsxs(Modal, { show: show, onHide: onHide, size: "lg", children: [_jsx(Modal.Header, { closeButton: true, children: _jsx(Modal.Title, { children: "Current Story JSON" }) }), _jsx(Modal.Body, { children: _jsx("pre", { style: {
                        maxHeight: '70vh',
                        overflow: 'auto',
                        backgroundColor: '#f5f5f5',
                        padding: '1rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                    }, children: _jsx("code", { children: jsonString }) }) }), _jsx(Modal.Footer, { children: _jsx(Button, { variant: "secondary", onClick: onHide, children: "Close" }) })] }));
}
