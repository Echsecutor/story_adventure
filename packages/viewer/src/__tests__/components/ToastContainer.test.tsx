/**
 * Unit tests for ToastContainer component and useToast hook.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { ToastProvider, useToast } from '../../components/modals/ToastContainer';

describe('ToastContainer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays a success toast when toastOk is called', async () => {
    const TestComponent = () => {
      const toast = useToast();
      
      useEffect(() => {
        toast.toastOk('Success message');
      }, [toast]);
      
      return <div>Test Component</div>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  it('displays an error toast when toastAlert is called', async () => {
    const TestComponent = () => {
      const toast = useToast();
      
      useEffect(() => {
        toast.toastAlert('Error message');
      }, [toast]);
      
      return <div>Test Component</div>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  it('displays an info toast when toastInfo is called', async () => {
    const TestComponent = () => {
      const toast = useToast();
      
      useEffect(() => {
        toast.toastInfo('Info message');
      }, [toast]);
      
      return <div>Test Component</div>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });
  });

  it('displays multiple toasts simultaneously', async () => {
    const TestComponent = () => {
      const toast = useToast();
      
      useEffect(() => {
        toast.toastOk('First message');
        toast.toastInfo('Second message');
      }, [toast]);
      
      return <div>Test Component</div>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });
  });

  it('maintains stable hook reference to prevent infinite loops', async () => {
    const effectCallCounter = vi.fn();
    
    const TestComponent = () => {
      const toast = useToast();
      const [, setCounter] = useState(0);
      
      // This useEffect simulates using toast in a dependency array
      // It should only run once, not infinitely
      useEffect(() => {
        effectCallCounter();
        toast.toastOk('Progress saved');
        // Trigger a re-render to test if the effect runs again
        setCounter(prev => prev + 1);
      }, [toast]);
      
      return <div>Test Component</div>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Wait for the component to stabilize
    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    // The effect should only be called once despite the state update
    // If the toast context value changes, it will trigger the effect again
    expect(effectCallCounter).toHaveBeenCalledTimes(1);
  });

  it('does not create infinite loop when showing toast in useEffect', async () => {
    const toastCallCounter = vi.fn();
    
    const TestComponent = () => {
      const toast = useToast();
      
      useEffect(() => {
        // Wrap the original function to count calls
        const wrappedToastOk = (...args: Parameters<typeof toast.toastOk>) => {
          toastCallCounter();
          return toast.toastOk(...args);
        };
        
        wrappedToastOk('Story loaded');
      }, [toast]);
      
      return <div>Test Component</div>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    // Should be called exactly once, not multiple times
    expect(toastCallCounter).toHaveBeenCalledTimes(1);
    
    // Verify the toast message appears
    await waitFor(() => {
      expect(screen.getByText('Story loaded')).toBeInTheDocument();
    });
  });

  it('throws error when useToast is used outside ToastProvider', () => {
    const TestComponent = () => {
      // This should throw an error
      useToast();
      return <div>Test</div>;
    };

    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    consoleError.mockRestore();
  });
});
