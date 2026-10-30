import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../shared/ui/estilos.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <main>Open Prontuário</main>
  </StrictMode>,
);
