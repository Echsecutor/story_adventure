/**
 * Tests for MenuScreen component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MenuScreen } from '../../components/MenuScreen';

describe('MenuScreen', () => {
  it('shows load button', () => {
    const onLoadFile = vi.fn();
    render(<MenuScreen onLoadFile={onLoadFile} />);
    expect(screen.getByText('Load a Story Adventure')).toBeInTheDocument();
  });

  it('calls onLoadFile when button is clicked', async () => {
    const user = userEvent.setup();
    const onLoadFile = vi.fn();
    render(<MenuScreen onLoadFile={onLoadFile} />);
    await user.click(screen.getByText('Load a Story Adventure'));
    expect(onLoadFile).toHaveBeenCalled();
  });

  it('displays help text', () => {
    const onLoadFile = vi.fn();
    render(<MenuScreen onLoadFile={onLoadFile} />);
    expect(screen.getByText(/Press.*\?.*to display the viewer help/i)).toBeInTheDocument();
  });

  it('displays title and description', () => {
    const onLoadFile = vi.fn();
    render(<MenuScreen onLoadFile={onLoadFile} />);
    expect(screen.getByText('Story Adventure Viewer')).toBeInTheDocument();
    expect(screen.getByText(/open source story adventure tools/i)).toBeInTheDocument();
  });
});
