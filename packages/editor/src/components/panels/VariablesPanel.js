import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Variables panel component for managing story variables.
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';
/**
 * Variables panel modal for managing story variables.
 */
export function VariablesPanel({ variables, onChange, show, onHide, }) {
    const [variableName, setVariableName] = useState('');
    const [variableValue, setVariableValue] = useState('');
    const [editingVariable, setEditingVariable] = useState(null);
    // Reset form when modal opens/closes
    useEffect(() => {
        if (!show) {
            setVariableName('');
            setVariableValue('');
            setEditingVariable(null);
        }
    }, [show]);
    const handleAddVariable = () => {
        if (!variableName.trim()) {
            alert('Please enter a variable name');
            return;
        }
        const newVariables = { ...variables };
        newVariables[variableName.trim()] = variableValue.trim();
        onChange(newVariables);
        setVariableName('');
        setVariableValue('');
    };
    const handleEditVariable = (varName) => {
        setEditingVariable(varName);
        setVariableName(varName);
        setVariableValue(variables[varName] || '');
    };
    const handleUpdateVariable = () => {
        if (!variableName.trim()) {
            alert('Please enter a variable name');
            return;
        }
        const newVariables = { ...variables };
        if (editingVariable && editingVariable !== variableName.trim()) {
            // Variable name changed, remove old and add new
            delete newVariables[editingVariable];
        }
        newVariables[variableName.trim()] = variableValue.trim();
        onChange(newVariables);
        setVariableName('');
        setVariableValue('');
        setEditingVariable(null);
    };
    const handleDeleteVariable = (varName) => {
        if (confirm(`Delete variable "${varName}"?`)) {
            const newVariables = { ...variables };
            delete newVariables[varName];
            onChange(newVariables);
            if (editingVariable === varName) {
                setEditingVariable(null);
                setVariableName('');
                setVariableValue('');
            }
        }
    };
    const variableNames = Object.keys(variables).sort();
    return (_jsxs(Modal, { show: show, onHide: onHide, size: "lg", children: [_jsx(Modal.Header, { closeButton: true, children: _jsx(Modal.Title, { children: "Story Variables" }) }), _jsxs(Modal.Body, { children: [_jsxs(Form.Group, { className: "mb-3", children: [_jsx(Form.Label, { children: editingVariable ? 'Edit Variable' : 'Add Variable' }), _jsxs("div", { className: "d-flex gap-2 mb-2", children: [_jsx(Form.Control, { type: "text", placeholder: "Variable name", value: variableName, onChange: (e) => setVariableName(e.target.value), disabled: !!editingVariable }), _jsx(Form.Control, { type: "text", placeholder: "Variable value", value: variableValue, onChange: (e) => setVariableValue(e.target.value) }), editingVariable ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "primary", onClick: handleUpdateVariable, children: "Update" }), _jsx(Button, { variant: "secondary", onClick: () => {
                                                    setEditingVariable(null);
                                                    setVariableName('');
                                                    setVariableValue('');
                                                }, children: "Cancel" })] })) : (_jsx(Button, { variant: "primary", onClick: handleAddVariable, children: "Add" }))] })] }), _jsx(Form.Label, { children: "Existing Variables" }), variableNames.length === 0 ? (_jsx("p", { className: "text-muted", children: "No variables defined" })) : (_jsx(ListGroup, { children: variableNames.map((varName) => (_jsxs(ListGroup.Item, { className: "d-flex justify-content-between align-items-center", children: [_jsxs("div", { children: [_jsx("strong", { children: varName }), " = ", variables[varName] || '(empty)'] }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx(Button, { variant: "outline-primary", size: "sm", onClick: () => handleEditVariable(varName), children: "Edit" }), _jsx(Button, { variant: "outline-danger", size: "sm", onClick: () => handleDeleteVariable(varName), children: "Delete" })] })] }, varName))) }))] }), _jsx(Modal.Footer, { children: _jsx(Button, { variant: "secondary", onClick: onHide, children: "Close" }) })] }));
}
