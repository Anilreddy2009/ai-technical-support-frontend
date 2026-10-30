import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, setToken } from '../api/client.js';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem('token') ? readStoredUser() : null));
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('user');
    setUser(null);
    queryClient.clear(); // never show one account's cached data to the next
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      queryClient.clear();
      setToken(res.accessToken);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
    },
    [queryClient],
  );

  const value = useMemo(() => ({ user, login, logout, isAdmin: user?.role === 'ADMIN' }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
