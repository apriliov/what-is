import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { navigate } from './router.jsx';
import { dropAllOwnerSecrets } from './chatCrypto.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', loginReady: false, user: null, isAdmin: false });
  const [loginNotice, setLoginNotice] = useState('');

  const refresh = useCallback(async () => {
    try {
      const d = await api('/api/me');
      setState({ status: 'ready', loginReady: Boolean(d.loginReady), user: d.user, isAdmin: Boolean(d.isAdmin) });
      if (!d.isAdmin) dropAllOwnerSecrets(); // owner chat memory only lives while logged in as admin
    } catch {
      // API not available (static hosting / local vite): behave as logged out.
      setState((s) => ({ ...s, status: 'ready' }));
    }
  }, []);

  useEffect(() => {
    refresh();
    // The OAuth callback redirects back with ?login=failed|cancelled. Show a notice and clean the URL.
    const params = new URLSearchParams(window.location.search);
    const flag = params.get('login');
    if (flag) {
      setLoginNotice(flag);
      params.delete('login');
      const q = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${q ? `?${q}` : ''}${window.location.hash}`);
    }
  }, [refresh]);

  const login = useCallback(() => {
    window.location.href = '/api/auth/login';
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST', body: {} });
    } catch {
      // ignore, we refresh below anyway
    }
    dropAllOwnerSecrets();
    await refresh();
    if (window.location.pathname === '/admin') navigate('/');
  }, [refresh]);

  const value = useMemo(
    () => ({ ...state, login, logout, refresh, loginNotice, clearNotice: () => setLoginNotice('') }),
    [state, login, logout, refresh, loginNotice]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
