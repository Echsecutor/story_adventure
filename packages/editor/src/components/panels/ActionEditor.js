import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Action editor component for editing section scripts.
 * Supports all 11 action types with recursive ACTION parameter support.
 */
import { useState, useEffect } from 'react';
import { Button, Form, Row, Col } from 'react-bootstrap';
import { supported_actions } from '@story-adventure/shared';
/**
 * Parameter input component that renders different input types based on parameter type.
 */
function ParameterInput({ parameterType, value, onChange, actionType, availableVariables, availableSections, }) {
    switch (parameterType) {
        case 'STRING': {
            return (_jsx(Form.Control, { type: "text", value: value, onChange: (e) => onChange(e.target.value) }));
        }
        case 'VARIABLE': {
            return (_jsxs(Form.Select, { value: value, onChange: (e) => onChange(e.target.value), children: [_jsx("option", { value: "", children: "Select variable..." }), availableVariables.map((varName) => (_jsx("option", { value: varName, children: varName }, varName)))] }));
        }
        case 'SECTION': {
            return (_jsxs(Form.Select, { value: value, onChange: (e) => onChange(e.target.value), children: [_jsx("option", { value: "", children: "Select section..." }), availableSections.map((sectionId) => (_jsx("option", { value: sectionId, children: sectionId }, sectionId)))] }));
        }
        case 'ENUM': {
            const enumOptions = supported_actions[actionType]?.enum || [];
            return (_jsxs(Form.Select, { value: value, onChange: (e) => onChange(e.target.value), children: [_jsx("option", { value: "", children: "Select value..." }), enumOptions.map((enumValue) => (_jsx("option", { value: enumValue, children: enumValue }, enumValue)))] }));
        }
        default:
            console.error('Unsupported parameter type:', parameterType);
            return _jsx(Form.Control, { type: "text", value: value, disabled: true });
    }
}
/**
 * Single action row with action selector and parameter inputs.
 * Handles recursive ACTION parameters by expanding them inline.
 *
 * The parameters array structure for ACTION parameters:
 * [param1, param2, ACTION_TYPE, nested_param1, nested_param2, ...]
 * The ACTION parameter stores the nested action type, followed by its parameters.
 */
function ActionRow({ action, availableVariables, availableSections, onChange, parameterStartIndex = 0, }) {
    const actionDef = supported_actions[action.action];
    const handleActionTypeChange = (newActionType) => {
        const newActionDef = supported_actions[newActionType];
        const newParameters = [];
        for (const paramType of newActionDef.parameters) {
            if (paramType === 'ACTION') {
                // For ACTION parameter, store the nested action type, then its parameters follow
                newParameters.push('NONE');
                // Add empty parameters for nested action
                const nestedDef = supported_actions.NONE;
                for (const _ of nestedDef.parameters) {
                    newParameters.push('');
                }
            }
            else {
                newParameters.push('');
            }
        }
        onChange({
            action: newActionType,
            parameters: newParameters,
        });
    };
    const handleParameterChange = (index, value) => {
        const newParameters = [...action.parameters];
        newParameters[index] = value;
        onChange({
            ...action,
            parameters: newParameters,
        });
    };
    // Build parameter inputs, handling ACTION parameters recursively
    const parameterInputs = [];
    let paramIndex = parameterStartIndex;
    for (let i = 0; i < actionDef.parameters.length; i++) {
        const paramType = actionDef.parameters[i];
        if (!paramType) {
            continue; // Skip undefined parameters
        }
        if (paramType === 'ACTION') {
            // Recursive action: the parameter at paramIndex is the nested action type
            const nestedActionType = (action.parameters[paramIndex] || 'NONE');
            const nestedActionDef = supported_actions[nestedActionType];
            // Count how many parameters the nested action needs
            let nestedParamCount = 0;
            for (const nestedParamType of nestedActionDef.parameters) {
                nestedParamCount++;
                if (nestedParamType === 'ACTION') {
                    // Recursive ACTION parameters - we'll handle them recursively
                    // For now, estimate: ACTION type + its parameters
                    nestedParamCount += 1; // ACTION type itself
                    // This is a simplification - fully recursive handling would be more complex
                }
            }
            // Extract nested action parameters (skip the ACTION type itself)
            const nestedParams = action.parameters.slice(paramIndex + 1, paramIndex + 1 + nestedParamCount);
            const nestedAction = {
                action: nestedActionType,
                parameters: nestedParams.length >= nestedParamCount
                    ? nestedParams.slice(0, nestedParamCount)
                    : [...nestedParams, ...Array(nestedParamCount - nestedParams.length).fill('')],
            };
            parameterInputs.push(_jsx(Col, { xs: 12, className: "mb-2", children: _jsxs("div", { className: "border p-2 rounded bg-light", children: [_jsx("small", { className: "text-muted d-block mb-1", children: "Nested Action" }), _jsx(ActionRow, { action: nestedAction, availableVariables: availableVariables, availableSections: availableSections, onChange: (newNestedAction) => {
                                // Replace the ACTION parameter and its nested parameters
                                const newParameters = [...action.parameters];
                                newParameters[paramIndex] = newNestedAction.action;
                                // Remove old nested parameters
                                const oldNestedParamCount = nestedParams.length;
                                newParameters.splice(paramIndex + 1, oldNestedParamCount);
                                // Add new nested parameters
                                newParameters.splice(paramIndex + 1, 0, ...newNestedAction.parameters);
                                onChange({
                                    ...action,
                                    parameters: newParameters,
                                });
                            }, parameterStartIndex: 0 })] }) }, `param-${i}`));
            paramIndex += 1 + nestedParamCount;
        }
        else {
            const paramValue = action.parameters[paramIndex] || '';
            parameterInputs.push(_jsx(Col, { children: _jsx(ParameterInput, { parameterType: paramType, value: paramValue, onChange: (value) => handleParameterChange(paramIndex, value), actionType: action.action, availableVariables: availableVariables, availableSections: availableSections }) }, `param-${i}`));
            paramIndex++;
        }
    }
    return (_jsxs("div", { children: [_jsx(Row, { className: "mb-2", children: _jsx(Col, { children: _jsx(Form.Select, { value: action.action, onChange: (e) => handleActionTypeChange(e.target.value), children: Object.keys(supported_actions).map((actionType) => (_jsx("option", { value: actionType, children: actionType }, actionType))) }) }) }), _jsx(Row, { className: "mb-2", children: parameterInputs })] }));
}
/**
 * Action editor component for managing section scripts.
 */
export function ActionEditor({ script = [], availableVariables, availableSections, onChange, }) {
    const [actions, setActions] = useState(script);
    // Sync with prop changes
    useEffect(() => {
        setActions(script);
    }, [script]);
    const handleAddAction = () => {
        const newAction = {
            action: 'NONE',
            parameters: [],
        };
        const newActions = [...actions, newAction];
        setActions(newActions);
        onChange(newActions);
    };
    const handleActionChange = (index, newAction) => {
        const newActions = [...actions];
        newActions[index] = newAction;
        setActions(newActions);
        onChange(newActions);
    };
    const handleDeleteAction = (index) => {
        const newActions = actions.filter((_, i) => i !== index);
        setActions(newActions);
        onChange(newActions);
    };
    return (_jsxs("div", { children: [_jsx("div", { className: "mb-3", children: _jsx(Button, { variant: "primary", onClick: handleAddAction, children: "Add Action" }) }), actions.map((action, index) => (_jsxs("div", { className: "mb-3 p-2 border rounded", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-start mb-2", children: [_jsxs("span", { className: "text-muted small", children: ["Action ", index + 1] }), _jsx(Button, { variant: "danger", size: "sm", onClick: () => handleDeleteAction(index), children: "Delete" })] }), _jsx(ActionRow, { action: action, availableVariables: availableVariables, availableSections: availableSections, onChange: (newAction) => handleActionChange(index, newAction) })] }, index))), actions.length === 0 && (_jsx("p", { className: "text-muted", children: "No actions. Click \"Add Action\" to add one." }))] }));
}
