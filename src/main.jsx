import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { LangProvider } from './i18n.jsx';
import { AuthProvider } from './auth.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LangProvider>
  </React.StrictMode>
);
