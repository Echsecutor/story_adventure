import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Dialog context for programmatic modal dialogs (alert, confirm, prompt).
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
const DialogContext = createContext(undefined);
export function DialogProvider({ children }) {
    const [state, setState] = useState({
        type: null,
        title: '',
        message: '',
    });
    const [inputValue, setInputValue] = useState('');
    const alert = useCallback((message, title = 'Alert') => {
        return new Promise((resolve) => {
            setState({ type: 'alert', title, message, resolve });
        });
    }, []);
    const confirm = useCallback((message, title = 'Confirm') => {
        return new Promise((resolve) => {
            setState({ type: 'confirm', title, message, resolve });
        });
    }, []);
    const prompt = useCallback((message, defaultValue = '', title = 'Input') => {
        return new Promise((resolve) => {
            setInputValue(defaultValue);
            setState({ type: 'prompt', title, message, defaultValue, resolve });
        });
    }, []);
    const handleClose = useCallback((result) => {
        if (state.type === 'alert' && 'resolve' in state) {
            state.resolve();
        }
        else if (state.type === 'confirm' && 'resolve' in state) {
            state.resolve(result);
        }
        else if (state.type === 'prompt' && 'resolve' in state) {
            state.resolve(result);
        }
        setState({ type: null, title: '', message: '' });
        setInputValue('');
    }, [state]);
    const handleConfirm = useCallback(() => {
        if (state.type === 'prompt') {
            handleClose(inputValue);
        }
        else {
            handleClose(true);
        }
    }, [state.type, inputValue, handleClose]);
    const handleCancel = useCallback(() => {
        if (state.type === 'confirm') {
            handleClose(false);
        }
        else if (state.type === 'prompt') {
            handleClose(null);
        }
        else {
            handleClose();
        }
    }, [state.type, handleClose]);
    return (_jsxs(DialogContext.Provider, { value: { alert, confirm, prompt }, children: [children, _jsxs(Modal, { show: state.type !== null, onHide: handleCancel, centered: true, children: [_jsx(Modal.Header, { closeButton: true, children: _jsx(Modal.Title, { children: state.title }) }), _jsxs(Modal.Body, { children: [_jsx("p", { children: state.message }), state.type === 'prompt' && (_jsx(Form.Control, { type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyDown: (e) => {
                                    if (e.key === 'Enter') {
                                        handleConfirm();
                                    }
                                }, autoFocus: true }))] }), _jsx(Modal.Footer, { children: state.type === 'alert' ? (_jsx(Button, { variant: "primary", onClick: handleCancel, children: "OK" })) : (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: handleCancel, children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: handleConfirm, children: "OK" })] })) })] })] }));
}
export function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
}
