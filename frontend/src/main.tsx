import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { reloadAfterChunkError } from './lib/chunkRecovery';
import './styles/index.css';

// Recover tabs opened before a deployment when their lazy-loaded files disappear.
window.addEventListener('vite:preloadError', () => {
  reloadAfterChunkError();
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const AppWithRouter = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppWithRouter />
      </GoogleOAuthProvider>
    ) : (
      <AppWithRouter />
    )}
  </React.StrictMode>
);

