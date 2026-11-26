import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('oslab_token') || '');
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('oslab_token')));
  const [dbStatus, setDbStatus] = useState('checking');

  const refreshHealth = useCallback(async () => {
    try {
      const h = await api.health();
      setDbStatus(h.database || 'connected');
    } catch {
      setDbStatus('offline');
    }
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    api
      .me(token)
      .then((res) => {
        if (!cancelled) setUser(res.user);
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('oslab_token');
          setToken('');
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('oslab_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (name, email, password, role = 'student') => {
    const res = await api.register({ name, email, password, role });
    localStorage.setItem('oslab_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('oslab_token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, dbStatus, login, register, logout, refreshHealth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
