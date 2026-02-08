/**
 * Variables panel component for managing story variables.
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';

export interface VariablesPanelProps {
  /** Current story variables */
  variables: Record<string, string>;
  /** Callback when variables change */
  onChange: (variables: Record<string, string>) => void;
  /** Whether the modal is shown */
  show: boolean;
  /** Callback to close the modal */
  onHide: () => void;
}

/**
 * Variables panel modal for managing story variables.
 */
export function VariablesPanel({
  variables,
  onChange,
  show,
  onHide,
}: VariablesPanelProps) {
  const [variableName, setVariableName] = useState('');
  const [variableValue, setVariableValue] = useState('');
  const [editingVariable, setEditingVariable] = useState<string | null>(null);

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

  const handleEditVariable = (varName: string) => {
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

  const handleDeleteVariable = (varName: string) => {
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

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Story Variables</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>
            {editingVariable ? 'Edit Variable' : 'Add Variable'}
          </Form.Label>
          <div className="d-flex gap-2 mb-2">
            <Form.Control
              type="text"
              placeholder="Variable name"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
              disabled={!!editingVariable}
            />
            <Form.Control
              type="text"
              placeholder="Variable value"
              value={variableValue}
              onChange={(e) => setVariableValue(e.target.value)}
            />
            {editingVariable ? (
              <>
                <Button variant="primary" onClick={handleUpdateVariable}>
                  Update
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingVariable(null);
                    setVariableName('');
                    setVariableValue('');
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={handleAddVariable}>
                Add
              </Button>
            )}
          </div>
        </Form.Group>

        <Form.Label>Existing Variables</Form.Label>
        {variableNames.length === 0 ? (
          <p className="text-muted">No variables defined</p>
        ) : (
          <ListGroup>
            {variableNames.map((varName) => (
              <ListGroup.Item
                key={varName}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{varName}</strong> = {variables[varName] || '(empty)'}
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleEditVariable(varName)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteVariable(varName)}
                  >
                    Delete
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
