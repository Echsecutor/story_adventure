import { jsx as _jsx } from "react/jsx-runtime";
/**
 * React entry point for the Story Adventure viewer.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import { DialogProvider } from './components/modals/DialogContext';
import { ToastProvider } from './components/modals/ToastContainer';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(DialogProvider, { children: _jsx(ToastProvider, { children: _jsx(App, {}) }) }) }));
