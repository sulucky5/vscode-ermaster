import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { Palette } from './components/Palette.js';
import { OutlinePanel } from './components/OutlinePanel.js';
import './index.css';
import '@xyflow/react/dist/style.css';

const viewMode = (window as unknown as { __ERMASTER_VIEW__?: string }).__ERMASTER_VIEW__;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {viewMode === 'palette' ? (
      <Palette section="tools" />
    ) : viewMode === 'view' ? (
      <Palette section="view" />
    ) : viewMode === 'menu' ? (
      <Palette section="actions" />
    ) : viewMode === 'outline' ? (
      <OutlinePanel />
    ) : (
      <App />
    )}
  </React.StrictMode>
);
