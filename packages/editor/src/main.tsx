/**
 * React entry point for the editor application.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App.js';
import { DialogProvider } from './components/modals/DialogContext';
import { ToastProvider } from './components/modals/ToastContainer';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <DialogProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </DialogProvider>
  </StrictMode>
);
