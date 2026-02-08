/**
 * Vitest setup file for component tests.
 * Includes React Flow mock for testing components that use React Flow hooks.
 */

import '@testing-library/jest-dom';

// Mock React Flow for tests
// Note: React Flow v12 uses a different mock approach
// For now, we'll mock the necessary globals manually
if (typeof window !== 'undefined') {
  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;

  // Mock DOMMatrixReadOnly
  global.DOMMatrixReadOnly = class DOMMatrixReadOnly {} as any;

  // Mock SVGElement.getBBox
  if (typeof SVGElement !== 'undefined') {
    SVGElement.prototype.getBBox = function() {
      return { x: 0, y: 0, width: 0, height: 0 };
    };
  }
}
