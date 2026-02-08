/**
 * Dialog context for programmatic modal dialogs (alert, confirm, prompt).
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface DialogContextValue {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
}

type DialogState =
  | {
      type: 'alert';
      title: string;
      message: string;
      resolve: (value: void) => void;
    }
  | {
      type: 'confirm';
      title: string;
      message: string;
      resolve: (value: boolean) => void;
    }
  | {
      type: 'prompt';
      title: string;
      message: string;
      defaultValue: string;
      resolve: (value: string | null) => void;
    }
  | {
      type: null;
      title: string;
      message: string;
    };

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({
    type: null,
    title: '',
    message: '',
  });
  const [inputValue, setInputValue] = useState('');

  const alert = useCallback((message: string, title = 'Alert') => {
    return new Promise<void>((resolve) => {
      setState({ type: 'alert', title, message, resolve });
    });
  }, []);

  const confirm = useCallback((message: string, title = 'Confirm') => {
    return new Promise<boolean>((resolve) => {
      setState({ type: 'confirm', title, message, resolve });
    });
  }, []);

  const prompt = useCallback((message: string, defaultValue = '', title = 'Input') => {
    return new Promise<string | null>((resolve) => {
      setInputValue(defaultValue);
      setState({ type: 'prompt', title, message, defaultValue, resolve });
    });
  }, []);

  const handleClose = useCallback((result?: boolean | string | null) => {
    if (state.type === 'alert' && 'resolve' in state) {
      state.resolve();
    } else if (state.type === 'confirm' && 'resolve' in state) {
      state.resolve(result as boolean);
    } else if (state.type === 'prompt' && 'resolve' in state) {
      state.resolve(result as string | null);
    }
    setState({ type: null, title: '', message: '' });
    setInputValue('');
  }, [state]);

  const handleConfirm = useCallback(() => {
    if (state.type === 'prompt') {
      handleClose(inputValue);
    } else {
      handleClose(true);
    }
  }, [state.type, inputValue, handleClose]);

  const handleCancel = useCallback(() => {
    if (state.type === 'confirm') {
      handleClose(false);
    } else if (state.type === 'prompt') {
      handleClose(null);
    } else {
      handleClose();
    }
  }, [state.type, handleClose]);

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      
      <Modal 
        show={state.type !== null} 
        onHide={handleCancel}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{state.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{state.message}</p>
          {state.type === 'prompt' && (
            <Form.Control
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
              autoFocus
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          {state.type === 'alert' ? (
            <Button variant="primary" onClick={handleCancel}>
              OK
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirm}>
                OK
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
