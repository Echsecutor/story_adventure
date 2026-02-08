/**
 * Unit tests for VariablesPanel component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VariablesPanel } from '../../components/panels/VariablesPanel.js';

describe('VariablesPanel', () => {
  const mockOnChange = vi.fn();
  const mockOnHide = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnHide.mockClear();
  });

  it('renders when shown', () => {
    render(
      <VariablesPanel
        variables={{ var1: 'value1', var2: 'value2' }}
        onChange={mockOnChange}
        show={true}
        onHide={mockOnHide}
      />
    );

    expect(screen.getByText('Story Variables')).toBeInTheDocument();
  });

  it('does not render when hidden', () => {
    render(
      <VariablesPanel
        variables={{ var1: 'value1' }}
        onChange={mockOnChange}
        show={false}
        onHide={mockOnHide}
      />
    );

    expect(screen.queryByText('Story Variables')).not.toBeInTheDocument();
  });

  it('displays existing variables', () => {
    render(
      <VariablesPanel
        variables={{ var1: 'value1', var2: 'value2' }}
        onChange={mockOnChange}
        show={true}
        onHide={mockOnHide}
      />
    );

    expect(screen.getByText('var1')).toBeInTheDocument();
    expect(screen.getByText('var2')).toBeInTheDocument();
    // Values are displayed as "var1 = value1", so check for text content containing the values
    const var1Element = screen.getByText('var1').closest('.list-group-item');
    expect(var1Element?.textContent).toContain('value1');
    const var2Element = screen.getByText('var2').closest('.list-group-item');
    expect(var2Element?.textContent).toContain('value2');
  });

  it('adds a new variable', () => {
    render(
      <VariablesPanel
        variables={{ var1: 'value1' }}
        onChange={mockOnChange}
        show={true}
        onHide={mockOnHide}
      />
    );

    const nameInput = screen.getByPlaceholderText('Variable name');
    const valueInput = screen.getByPlaceholderText('Variable value');
    const addButton = screen.getByText('Add');

    fireEvent.change(nameInput, { target: { value: 'newVar' } });
    fireEvent.change(valueInput, { target: { value: 'newValue' } });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      var1: 'value1',
      newVar: 'newValue',
    });
  });

  it('edits an existing variable', () => {
    render(
      <VariablesPanel
        variables={{ var1: 'value1' }}
        onChange={mockOnChange}
        show={true}
        onHide={mockOnHide}
      />
    );

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    const valueInput = screen.getByPlaceholderText('Variable value');
    fireEvent.change(valueInput, { target: { value: 'updatedValue' } });

    const updateButton = screen.getByText('Update');
    fireEvent.click(updateButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      var1: 'updatedValue',
    });
  });

  it('deletes a variable', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    render(
      <VariablesPanel
        variables={{ var1: 'value1', var2: 'value2' }}
        onChange={mockOnChange}
        show={true}
        onHide={mockOnHide}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]); // Delete first variable

    expect(mockOnChange).toHaveBeenCalledWith({
      var2: 'value2',
    });

    window.confirm = originalConfirm;
  });

  it('shows empty state when no variables', () => {
    render(
      <VariablesPanel
        variables={{}}
        onChange={mockOnChange}
        show={true}
        onHide={mockOnHide}
      />
    );

    expect(screen.getByText('No variables defined')).toBeInTheDocument();
  });
});
