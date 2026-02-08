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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DialogProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </DialogProvider>
  </React.StrictMode>
);
