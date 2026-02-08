/**
 * Unit tests for ToastContainer component and useToast hook.
 * 
 * These tests verify the critical functionality of OUR code:
 * 1. Toast context provides required API
 * 2. Hook maintains stable references (prevents infinite loops)
 * 3. Error handling for missing provider
 * 
 * Visual rendering and auto-dismiss are tested in E2E tests since they involve
 * React Bootstrap's Toast component which has complex behavior in test environments.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEffect } from 'react';
import { ToastProvider, useToast } from '../../components/modals/ToastContainer';

describe('ToastContainer', () => {
  it('provides all required toast functions', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    expect(typeof result.current.toastOk).toBe('function');
    expect(typeof result.current.toastAlert).toBe('function');
    expect(typeof result.current.toastInfo).toBe('function');
    expect(typeof result.current.showToast).toBe('function');
  });

  it('toast functions can be called without throwing', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    // These should not throw errors
    act(() => {
      result.current.toastOk('Success');
      result.current.toastAlert('Error');
      result.current.toastInfo('Info');
    });

    // If we got here, no errors were thrown
    expect(true).toBe(true);
  });

  it('toast functions maintain stable references', () => {
    const { result, rerender } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    const initialToastOk = result.current.toastOk;
    const initialToastAlert = result.current.toastAlert;
    const initialToastInfo = result.current.toastInfo;

    // Re-render
    rerender();

    // Functions should have same references
    expect(result.current.toastOk).toBe(initialToastOk);
    expect(result.current.toastAlert).toBe(initialToastAlert);
    expect(result.current.toastInfo).toBe(initialToastInfo);
  });

  it('does not cause infinite loop when called in useEffect', () => {
    let effectCallCount = 0;

    renderHook(
      () => {
        const toast = useToast();
        
        // Simulate the App.tsx pattern
        useEffect(() => {
          effectCallCount++;
          toast.toastOk('Loaded saved story');
        }, [toast]);
        
        return toast;
      },
      { wrapper: ToastProvider }
    );

    // Effect should have run exactly once (not repeatedly)
    // If toast reference changes, it would trigger the effect multiple times
    expect(effectCallCount).toBe(1);
  });

  it('throws error when useToast is used outside ToastProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within a ToastProvider');

    consoleError.mockRestore();
  });
});
