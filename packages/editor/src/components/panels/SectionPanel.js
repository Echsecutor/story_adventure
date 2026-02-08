import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Right sidebar panel for editing selected section or choice.
 */
import { useState, useEffect, useRef } from 'react';
import { Button, Form } from 'react-bootstrap';
import { ActionEditor } from './ActionEditor.js';
import { handleImagePaste } from '../../utils/mediaHandler.js';
import { loadImageFile } from '../../utils/fileLoader.js';
/**
 * Panel component for editing selected section or choice.
 */
export function SectionPanel({ selectedNode, selectedEdge, onUpdateSection, onUpdateChoice, onDelete, onAddChoice, availableSections, availableVariables, }) {
    const [text, setText] = useState('');
    const [mediaSrc, setMediaSrc] = useState('');
    const [targetSectionId, setTargetSectionId] = useState('');
    const textAreaRef = useRef(null);
    // Update form when selection changes
    useEffect(() => {
        if (selectedNode) {
            const section = selectedNode.data.section;
            setText(section.text_lines?.join('\n') || section.text || '');
            setMediaSrc(section.media?.src || '');
            setTargetSectionId('');
        }
        else if (selectedEdge && selectedEdge.data) {
            const choice = selectedEdge.data.choice;
            setText(choice.text || '');
            setMediaSrc('');
            setTargetSectionId(selectedEdge.target);
        }
        else {
            setText('');
            setMediaSrc('');
            setTargetSectionId('');
        }
    }, [selectedNode, selectedEdge]);
    // Handle text changes
    const handleTextChange = (newText) => {
        setText(newText);
        if (selectedNode) {
            onUpdateSection(selectedNode.id, {
                text_lines: newText.split('\n'),
            });
        }
        else if (selectedEdge) {
            onUpdateChoice(selectedEdge.source, selectedEdge.target, newText);
        }
    };
    // Handle media source changes
    const handleMediaSrcChange = (newSrc) => {
        setMediaSrc(newSrc);
        if (selectedNode) {
            onUpdateSection(selectedNode.id, {
                media: newSrc
                    ? {
                        type: 'image',
                        src: newSrc,
                    }
                    : undefined,
            });
        }
    };
    // Handle media removal
    const handleRemoveMedia = () => {
        setMediaSrc('');
        if (selectedNode) {
            onUpdateSection(selectedNode.id, {
                media: undefined,
            });
        }
    };
    // Handle load media from file
    const handleLoadMedia = async () => {
        if (!selectedNode) {
            return;
        }
        try {
            const dataUrl = await loadImageFile();
            setMediaSrc(dataUrl);
            onUpdateSection(selectedNode.id, {
                media: {
                    type: 'image',
                    src: dataUrl,
                },
            });
        }
        catch (error) {
            console.error('Error loading media:', error);
        }
    };
    // Handle image paste
    useEffect(() => {
        const textArea = textAreaRef.current;
        if (!textArea || !selectedNode) {
            return;
        }
        const handlePaste = async (event) => {
            const imageDataUrl = await handleImagePaste(event);
            if (imageDataUrl) {
                event.preventDefault();
                setMediaSrc(imageDataUrl);
                onUpdateSection(selectedNode.id, {
                    media: {
                        type: 'image',
                        src: imageDataUrl,
                    },
                });
            }
        };
        textArea.addEventListener('paste', handlePaste);
        return () => {
            textArea.removeEventListener('paste', handlePaste);
        };
    }, [selectedNode, onUpdateSection]);
    // Handle script (actions) changes
    const handleScriptChange = (script) => {
        if (selectedNode) {
            onUpdateSection(selectedNode.id, {
                script: script.length > 0 ? script : undefined,
            });
        }
    };
    // Handle adding choice
    const handleAddChoice = () => {
        if (selectedNode && targetSectionId) {
            if (targetSectionId === 'new') {
                // onAddChoice will handle creating new section
                onAddChoice('new');
            }
            else {
                onAddChoice(targetSectionId);
            }
            setTargetSectionId('');
        }
    };
    if (!selectedNode && !selectedEdge) {
        return (_jsx("div", { style: { padding: '20px' }, children: _jsx("p", { children: "Select a node or edge to edit" }) }));
    }
    const isEditingSection = !!selectedNode;
    return (_jsxs("div", { style: { padding: '20px', maxWidth: '400px' }, children: [_jsx("h5", { children: isEditingSection
                    ? `Section ${selectedNode.id}`
                    : `Choice: ${selectedEdge?.source} → ${selectedEdge?.target}` }), _jsxs(Form.Group, { className: "mb-3", children: [_jsx(Form.Label, { children: isEditingSection ? 'Story Text' : 'Choice Text' }), _jsx(Form.Control, { ref: textAreaRef, as: "textarea", rows: 10, value: text, onChange: (e) => handleTextChange(e.target.value), placeholder: isEditingSection ? 'Enter story text... (Paste image to add media)' : 'Enter choice text...' })] }), isEditingSection && (_jsxs(_Fragment, { children: [_jsxs(Form.Group, { className: "mb-3", children: [_jsx(Form.Label, { children: "Media" }), _jsxs("div", { className: "d-flex gap-2 mb-2", children: [_jsx(Button, { variant: "outline-primary", size: "sm", onClick: handleLoadMedia, children: "Load Picture" }), mediaSrc && (_jsx(Button, { variant: "outline-danger", size: "sm", onClick: handleRemoveMedia, children: "Remove Media" }))] }), _jsx(Form.Control, { type: "text", value: mediaSrc, onChange: (e) => handleMediaSrcChange(e.target.value), placeholder: "Image URL or data URL (or paste image in text area)" })] }), mediaSrc && (_jsx("div", { className: "mb-3", children: _jsx("img", { src: mediaSrc, alt: "Section media", style: { maxHeight: '300px', width: '100%', objectFit: 'contain' } }) })), _jsxs(Form.Group, { className: "mb-3", children: [_jsx(Form.Label, { children: "Actions (Script)" }), _jsx(ActionEditor, { script: selectedNode.data.section.script, availableVariables: availableVariables, availableSections: availableSections.map((s) => s.id), onChange: handleScriptChange })] }), _jsxs(Form.Group, { className: "mb-3", children: [_jsx(Form.Label, { children: "Add Choice to Section" }), _jsxs("div", { className: "d-flex gap-2", children: [_jsxs(Form.Select, { value: targetSectionId, onChange: (e) => setTargetSectionId(e.target.value), children: [_jsx("option", { value: "", children: "Select target section..." }), availableSections.map((section) => (_jsx("option", { value: section.id, children: section.id }, section.id))), _jsx("option", { value: "new", children: "+ New Section" })] }), _jsx(Button, { variant: "primary", onClick: handleAddChoice, disabled: !targetSectionId, children: "Add Choice" })] })] })] })), _jsxs(Button, { variant: "danger", onClick: onDelete, className: "mt-3", children: ["Delete ", isEditingSection ? 'Section' : 'Choice'] })] }));
}
