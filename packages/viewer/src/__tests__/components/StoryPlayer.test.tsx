/**
 * Tests for StoryPlayer component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoryPlayer } from '../../components/StoryPlayer';

describe('StoryPlayer', () => {
  it('renders section text correctly', () => {
    const text = 'Hello, this is a test story section.';
    render(<StoryPlayer text={text} isVisible={true} />);
    expect(screen.getByText(/Hello, this is a test story section/i)).toBeInTheDocument();
  });

  it('renders markdown correctly', () => {
    const text = '**Bold text** and *italic text*';
    render(<StoryPlayer text={text} isVisible={true} />);
    // Markdown should be converted to HTML
    const container = screen.getByText(/Bold text/i).closest('#story_text');
    expect(container).toBeInTheDocument();
  });

  it('does not render when isVisible is false', () => {
    const text = 'Hidden text';
    const { container } = render(<StoryPlayer text={text} isVisible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles empty text', () => {
    render(<StoryPlayer text="" isVisible={true} />);
    const container = document.getElementById('story_text');
    expect(container).toBeInTheDocument();
  });
});
