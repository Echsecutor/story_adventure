import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Dialog for creating linear story exports.
 * Prompts user for start section, end section, and sections to pass through.
 */
import { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { downloadLinearStory } from '../../utils/bundle.js';
import { toastAlert, toastOk } from '../../utils/toast.js';
export function LinearizeDialog({ show, onHide, story }) {
    const [startAt, setStartAt] = useState('');
    const [endAt, setEndAt] = useState('');
    const [passingThrough, setPassingThrough] = useState('');
    const [error, setError] = useState(null);
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
            toastOk('Linear story generated');
            onHide();
            // Reset form
            setStartAt('');
            setEndAt('');
            setPassingThrough('');
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error generating linear story';
            setError(errorMessage);
            toastAlert(errorMessage);
        }
    };
    const handleClose = () => {
        setError(null);
        onHide();
    };
    return (_jsxs(Modal, { show: show, onHide: handleClose, size: "lg", children: [_jsx(Modal.Header, { closeButton: true, children: _jsx(Modal.Title, { children: "Create Linear Story" }) }), _jsxs(Modal.Body, { children: [error && _jsx(Alert, { variant: "danger", children: error }), _jsxs(Form, { children: [_jsxs(Form.Group, { className: "mb-3", children: [_jsx(Form.Label, { children: "Start at section:" }), _jsxs(Form.Select, { value: startAt, onChange: (e) => setStartAt(e.target.value), children: [_jsx("option", { value: "", children: "Select start section" }), sectionIds.map((id) => (_jsx("option", { value: id, children: id }, id)))] })] }), _jsxs(Form.Group, { className: "mb-3", children: [_jsx(Form.Label, { children: "Finish at section:" }), _jsxs(Form.Select, { value: endAt, onChange: (e) => setEndAt(e.target.value), children: [_jsx("option", { value: "", children: "Select end section" }), sectionIds.map((id) => (_jsx("option", { value: id, children: id }, id)))] })] }), _jsxs(Form.Group, { className: "mb-3", children: [_jsx(Form.Label, { children: "Sections to pass through (comma-separated, optional):" }), _jsx(Form.Control, { type: "text", value: passingThrough, onChange: (e) => setPassingThrough(e.target.value), placeholder: "e.g., 2, 5, 10" }), _jsx(Form.Text, { className: "text-muted", children: "Enter section IDs separated by commas. The linear story must visit all of these sections." })] })] })] }), _jsxs(Modal.Footer, { children: [_jsx(Button, { variant: "secondary", onClick: handleClose, children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: handleGenerate, children: "Generate Markdown" })] })] }));
}
