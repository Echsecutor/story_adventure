/**
 * Unit tests for ActionEditor component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionEditor } from '../../components/panels/ActionEditor.js';
import type { Action } from '@story-adventure/shared';

describe('ActionEditor', () => {
  const mockOnChange = vi.fn();
  const availableVariables = ['var1', 'var2'];
  const availableSections = ['1', '2', '3'];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders empty state when no actions', () => {
    render(
      <ActionEditor
        script={[]}
        availableVariables={availableVariables}
        availableSections={availableSections}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('No actions. Click "Add Action" to add one.')).toBeInTheDocument();
  });

  it('adds a new action when "Add Action" is clicked', () => {
    render(
      <ActionEditor
        script={[]}
        availableVariables={availableVariables}
        availableSections={availableSections}
        onChange={mockOnChange}
      />
    );

    const addButton = screen.getByText('Add Action');
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith([
      { action: 'NONE', parameters: [] },
    ]);
  });

  it('renders existing actions', () => {
    const script: Action[] = [
      {
        action: 'SET',
        parameters: ['var1', 'value1'],
      },
    ];

    render(
      <ActionEditor
        script={script}
        availableVariables={availableVariables}
        availableSections={availableSections}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SET')).toBeInTheDocument();
  });

  it('deletes an action when delete button is clicked', () => {
    const script: Action[] = [
      {
        action: 'SET',
        parameters: ['var1', 'value1'],
      },
    ];

    render(
      <ActionEditor
        script={script}
        availableVariables={availableVariables}
        availableSections={availableSections}
        onChange={mockOnChange}
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('updates action type when changed', () => {
    const script: Action[] = [
      {
        action: 'SET',
        parameters: ['var1', 'value1'],
      },
    ];

    render(
      <ActionEditor
        script={script}
        availableVariables={availableVariables}
        availableSections={availableSections}
        onChange={mockOnChange}
      />
    );

    const select = screen.getByDisplayValue('SET');
    fireEvent.change(select, { target: { value: 'ADD_TO_VARIABLE' } });

    expect(mockOnChange).toHaveBeenCalled();
    const call = mockOnChange.mock.calls[0][0];
    expect(call[0].action).toBe('ADD_TO_VARIABLE');
  });

  it('renders VARIABLE parameter as dropdown', () => {
    const script: Action[] = [
      {
        action: 'SET',
        parameters: ['var1', 'value1'],
      },
    ];

    render(
      <ActionEditor
        script={script}
        availableVariables={availableVariables}
        availableSections={availableSections}
        onChange={mockOnChange}
      />
    );

    // Find the variable select (first parameter of SET is VARIABLE)
    const selects = screen.getAllByRole('combobox');
    const variableSelect = selects.find((s) => 
      Array.from(s.querySelectorAll('option')).some((opt) => opt.textContent === 'var1')
    );
    expect(variableSelect).toBeInTheDocument();
  });

  it('renders STRING parameter as text input', () => {
    const script: Action[] = [
      {
        action: 'SET',
        parameters: ['var1', 'value1'],
      },
    ];

    render(
      <ActionEditor
        script={script}
        availableVariables={availableVariables}
        availableSections={availableSections}
        onChange={mockOnChange}
      />
    );

    // Find text input (second parameter of SET is STRING)
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('does not trigger onChange when re-rendering with same content but different reference', () => {
    const script: Action[] = [
      {
        action: 'SET',
        parameters: ['var1', 'value1'],
      },
    ];

    const { rerender } = render(
      <ActionEditor
        script={script}
        availableVariables={availableVariables}
        availableSections={availableSections}
        onChange={mockOnChange}
      />
    );

    // Clear any initial calls
    mockOnChange.mockClear();

    // Re-render with new array reference but same content
    const scriptCopy: Action[] = [
      {
        action: 'SET',
        parameters: ['var1', 'value1'],
      },
    ];

    rerender(
      <ActionEditor
        script={scriptCopy}
        availableVariables={availableVariables}
        availableSections={availableSections}
        onChange={mockOnChange}
      />
    );

    // onChange should NOT be called since content is identical
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('does update when script content actually changes', () => {
    const script: Action[] = [
      {
        action: 'SET',
        parameters: ['var1', 'value1'],
      },
    ];

    const { rerender } = render(
      <ActionEditor
        script={script}
        availableVariables={availableVariables}
        availableSections={availableSections}
        onChange={mockOnChange}
      />
    );

    // Clear any initial calls
    mockOnChange.mockClear();

    // Re-render with different content
    const newScript: Action[] = [
      {
        action: 'ADD_TO_VARIABLE',
        parameters: ['var2', '5'],
      },
    ];

    rerender(
      <ActionEditor
        script={newScript}
        availableVariables={availableVariables}
        availableSections={availableSections}
        onChange={mockOnChange}
      />
    );

    // Component should update its internal state
    expect(screen.getByDisplayValue('ADD_TO_VARIABLE')).toBeInTheDocument();
  });
});
