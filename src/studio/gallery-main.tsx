import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StarterGallery } from '../components/gallery/StarterGallery';
import './studio.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('The starter gallery root element is missing.');

createRoot(rootElement).render(
  <StrictMode><StarterGallery /></StrictMode>,
);
