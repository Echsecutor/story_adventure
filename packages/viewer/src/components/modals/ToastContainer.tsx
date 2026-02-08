/**
 * Toast container component for non-blocking notifications.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastContainer as BootstrapToastContainer } from 'react-bootstrap';

interface ToastMessage {
  id: number;
  message: string;
  variant: 'success' | 'danger' | 'info' | 'warning';
}

interface ToastContextValue {
  showToast: (message: string, variant: 'success' | 'danger' | 'info' | 'warning') => void;
  toastOk: (message: string) => void;
  toastAlert: (message: string) => void;
  toastInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [nextId, setNextId] = useState(0);

  const showToast = useCallback((message: string, variant: 'success' | 'danger' | 'info' | 'warning') => {
    setNextId((currentId) => {
      const id = currentId;
      setToasts((prev) => [...prev, { id, message, variant }]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 5000);
      
      return currentId + 1;
    });
  }, []);

  const toastOk = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const toastAlert = useCallback((message: string) => {
    showToast(message, 'danger');
  }, [showToast]);

  const toastInfo = useCallback((message: string) => {
    showToast(message, 'info');
  }, [showToast]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toastOk, toastAlert, toastInfo }}>
      {children}
      <BootstrapToastContainer 
        position="top-end" 
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            onClose={() => removeToast(toast.id)}
            bg={toast.variant}
            autohide
            delay={5000}
          >
            <Toast.Header>
              <strong className="me-auto">
                {toast.variant === 'success' ? '✓ Success' : 
                 toast.variant === 'danger' ? '✗ Error' : 
                 toast.variant === 'warning' ? '⚠ Warning' : 
                 'ℹ Info'}
              </strong>
            </Toast.Header>
            <Toast.Body className={toast.variant === 'danger' || toast.variant === 'warning' ? 'text-white' : ''}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </BootstrapToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
