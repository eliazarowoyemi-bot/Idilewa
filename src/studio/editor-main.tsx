import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StudioEditor } from '../components/editor/StudioEditor';
import './studio.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('The studio root element is missing.');

createRoot(rootElement).render(
  <StrictMode><StudioEditor /></StrictMode>,
);
