/**
 * Tests for ChoiceButtons component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoiceButtons } from '../../components/ChoiceButtons';
import type { Choice } from '@story-adventure/shared';

describe('ChoiceButtons', () => {
  it('renders choices correctly', () => {
    const choices: Choice[] = [
      { text: 'Go left', next: 'section1' },
      { text: 'Go right', next: 'section2' },
    ];
    const onChoiceClick = vi.fn();
    render(<ChoiceButtons choices={choices} onChoiceClick={onChoiceClick} />);
    expect(screen.getByText('Go left')).toBeInTheDocument();
    expect(screen.getByText('Go right')).toBeInTheDocument();
  });

  it('calls onChoiceClick when a choice is clicked', async () => {
    const user = userEvent.setup();
    const choices: Choice[] = [{ text: 'Continue', next: 'next_section' }];
    const onChoiceClick = vi.fn();
    render(<ChoiceButtons choices={choices} onChoiceClick={onChoiceClick} />);
    await user.click(screen.getByText('Continue'));
    expect(onChoiceClick).toHaveBeenCalledWith('next_section');
  });

  it('renders arrow for empty text choices', () => {
    const choices: Choice[] = [{ text: '', next: 'next_section' }];
    const onChoiceClick = vi.fn();
    render(<ChoiceButtons choices={choices} onChoiceClick={onChoiceClick} />);
    // Should render an arrow character
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe('→');
  });

  it('returns null when no choices', () => {
    const { container } = render(
      <ChoiceButtons choices={[]} onChoiceClick={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});
