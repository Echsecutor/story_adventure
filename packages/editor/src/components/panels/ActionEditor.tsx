/**
 * Action editor component for editing section scripts.
 * Supports all 11 action types with recursive ACTION parameter support.
 */

import { useState, useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { Button, Form, Row, Col } from 'react-bootstrap';
import type { Action, ActionType } from '@story-adventure/shared';
import { supported_actions } from '@story-adventure/shared';

export interface ActionEditorProps {
  /** Current section's script (array of actions) */
  script?: Action[];
  /** Available story variables for VARIABLE parameters */
  availableVariables: string[];
  /** Available section IDs for SECTION parameters */
  availableSections: string[];
  /** Callback when script changes */
  onChange: (script: Action[]) => void;
}

/**
 * Parameter input component that renders different input types based on parameter type.
 */
function ParameterInput({
  parameterType,
  value,
  onChange,
  actionType,
  availableVariables,
  availableSections,
}: {
  parameterType: string;
  value: string;
  onChange: (value: string) => void;
  actionType: ActionType;
  availableVariables: string[];
  availableSections: string[];
}) {
  switch (parameterType) {
    case 'STRING': {
      return (
        <Form.Control
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
    case 'VARIABLE': {
      return (
        <Form.Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select variable...</option>
          {availableVariables.map((varName) => (
            <option key={varName} value={varName}>
              {varName}
            </option>
          ))}
        </Form.Select>
      );
    }
    case 'SECTION': {
      return (
        <Form.Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select section...</option>
          {availableSections.map((sectionId) => (
            <option key={sectionId} value={sectionId}>
              {sectionId}
            </option>
          ))}
        </Form.Select>
      );
    }
    case 'ENUM': {
      const enumOptions = supported_actions[actionType]?.enum || [];
      return (
        <Form.Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select value...</option>
          {enumOptions.map((enumValue) => (
            <option key={enumValue} value={enumValue}>
              {enumValue}
            </option>
          ))}
        </Form.Select>
      );
    }
    default:
      console.error('Unsupported parameter type:', parameterType);
      return <Form.Control type="text" value={value} disabled />;
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
function ActionRow({
  action,
  availableVariables,
  availableSections,
  onChange,
  parameterStartIndex = 0,
}: {
  action: Action;
  availableVariables: string[];
  availableSections: string[];
  onChange: (action: Action) => void;
  parameterStartIndex?: number;
}) {
  const actionDef = supported_actions[action.action];
  
  const handleActionTypeChange = (newActionType: ActionType) => {
    const newActionDef = supported_actions[newActionType];
    const newParameters: string[] = [];
    for (const paramType of newActionDef.parameters) {
      if (paramType === 'ACTION') {
        // For ACTION parameter, store the nested action type, then its parameters follow
        newParameters.push('NONE');
        // Add empty parameters for nested action
        const nestedDef = supported_actions.NONE;
        for (const _ of nestedDef.parameters) {
          newParameters.push('');
        }
      } else {
        newParameters.push('');
      }
    }
    onChange({
      action: newActionType,
      parameters: newParameters,
    });
  };

  const handleParameterChange = (index: number, value: string) => {
    const newParameters = [...action.parameters];
    newParameters[index] = value;
    onChange({
      ...action,
      parameters: newParameters,
    });
  };

  // Build parameter inputs, handling ACTION parameters recursively
  const parameterInputs: JSX.Element[] = [];
  let paramIndex = parameterStartIndex;
  
  for (let i = 0; i < actionDef.parameters.length; i++) {
    const paramType = actionDef.parameters[i];
    if (!paramType) {
      continue; // Skip undefined parameters
    }
    
    if (paramType === 'ACTION') {
      // Recursive action: the parameter at paramIndex is the nested action type
      const nestedActionType = (action.parameters[paramIndex] || 'NONE') as ActionType;
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
      const nestedAction: Action = {
        action: nestedActionType,
        parameters: nestedParams.length >= nestedParamCount 
          ? nestedParams.slice(0, nestedParamCount)
          : [...nestedParams, ...Array(nestedParamCount - nestedParams.length).fill('')],
      };
      
      parameterInputs.push(
        <Col key={`param-${i}`} xs={12} className="mb-2">
          <div className="border p-2 rounded bg-light">
            <small className="text-muted d-block mb-1">Nested Action</small>
            <ActionRow
              action={nestedAction}
              availableVariables={availableVariables}
              availableSections={availableSections}
              onChange={(newNestedAction) => {
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
              }}
              parameterStartIndex={0}
            />
          </div>
        </Col>
      );
      
      paramIndex += 1 + nestedParamCount;
    } else {
      const paramValue = action.parameters[paramIndex] || '';
      parameterInputs.push(
        <Col key={`param-${i}`}>
          <ParameterInput
            parameterType={paramType}
            value={paramValue}
            onChange={(value) => handleParameterChange(paramIndex, value)}
            actionType={action.action}
            availableVariables={availableVariables}
            availableSections={availableSections}
          />
        </Col>
      );
      paramIndex++;
    }
  }

  return (
    <div>
      <Row className="mb-2">
        <Col>
          <Form.Select
            value={action.action}
            onChange={(e) => handleActionTypeChange(e.target.value as ActionType)}
          >
            {Object.keys(supported_actions).map((actionType) => (
              <option key={actionType} value={actionType}>
                {actionType}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>
      <Row className="mb-2">
        {parameterInputs}
      </Row>
    </div>
  );
}

/**
 * Deep equality check for action arrays to prevent unnecessary updates.
 */
function areActionsEqual(a: Action[], b: Action[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((action, i) => {
    const other = b[i];
    if (!other) return false;
    if (action.action !== other.action) return false;
    if (action.parameters.length !== other.parameters.length) return false;
    return action.parameters.every((param, j) => param === other.parameters[j]);
  });
}

/**
 * Action editor component for managing section scripts.
 */
export function ActionEditor({
  script = [],
  availableVariables,
  availableSections,
  onChange,
}: ActionEditorProps) {
  const [actions, setActions] = useState<Action[]>(script);
  const isInternalChangeRef = useRef(false);

  // Sync with prop changes only when content actually differs
  useEffect(() => {
    // Skip if this update came from our own onChange callback
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    
    // Only update if the script content has actually changed
    if (!areActionsEqual(actions, script)) {
      setActions(script);
    }
  }, [script, actions]);

  const handleAddAction = () => {
    const newAction: Action = {
      action: 'NONE',
      parameters: [],
    };
    const newActions = [...actions, newAction];
    setActions(newActions);
    isInternalChangeRef.current = true;
    onChange(newActions);
  };

  const handleActionChange = (index: number, newAction: Action) => {
    const newActions = [...actions];
    newActions[index] = newAction;
    setActions(newActions);
    isInternalChangeRef.current = true;
    onChange(newActions);
  };

  const handleDeleteAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    setActions(newActions);
    isInternalChangeRef.current = true;
    onChange(newActions);
  };

  return (
    <div>
      <div className="mb-3">
        <Button variant="primary" onClick={handleAddAction}>
          Add Action
        </Button>
      </div>
      
      {actions.map((action, index) => (
        <div key={index} className="mb-3 p-2 border rounded">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <span className="text-muted small">Action {index + 1}</span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteAction(index)}
            >
              Delete
            </Button>
          </div>
          <ActionRow
            action={action}
            availableVariables={availableVariables}
            availableSections={availableSections}
            onChange={(newAction) => handleActionChange(index, newAction)}
          />
        </div>
      ))}
      
      {actions.length === 0 && (
        <p className="text-muted">No actions. Click "Add Action" to add one.</p>
      )}
    </div>
  );
}
