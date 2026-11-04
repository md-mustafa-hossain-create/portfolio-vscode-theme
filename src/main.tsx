import {createRoot} from 'react-dom/client';
import '@vscode/codicons/dist/codicon.css';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.debug('ServiceWorker registration ignored:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);


