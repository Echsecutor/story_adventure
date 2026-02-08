import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Toast container component for non-blocking notifications.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastContainer as BootstrapToastContainer } from 'react-bootstrap';
const ToastContext = createContext(undefined);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [nextId, setNextId] = useState(0);
    const showToast = useCallback((message, variant) => {
        const id = nextId;
        setNextId(id + 1);
        setToasts((prev) => [...prev, { id, message, variant }]);
        // Auto-remove after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 5000);
    }, [nextId]);
    const toastOk = useCallback((message) => {
        showToast(message, 'success');
    }, [showToast]);
    const toastAlert = useCallback((message) => {
        showToast(message, 'danger');
    }, [showToast]);
    const toastInfo = useCallback((message) => {
        showToast(message, 'info');
    }, [showToast]);
    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);
    return (_jsxs(ToastContext.Provider, { value: { showToast, toastOk, toastAlert, toastInfo }, children: [children, _jsx(BootstrapToastContainer, { position: "top-end", className: "p-3", style: { zIndex: 9999 }, children: toasts.map((toast) => (_jsxs(Toast, { onClose: () => removeToast(toast.id), bg: toast.variant, autohide: true, delay: 5000, children: [_jsx(Toast.Header, { children: _jsx("strong", { className: "me-auto", children: toast.variant === 'success' ? '✓ Success' :
                                    toast.variant === 'danger' ? '✗ Error' :
                                        toast.variant === 'warning' ? '⚠ Warning' :
                                            'ℹ Info' }) }), _jsx(Toast.Body, { className: toast.variant === 'danger' || toast.variant === 'warning' ? 'text-white' : '', children: toast.message })] }, toast.id))) })] }));
}
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
