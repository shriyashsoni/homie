import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { signInWithGoogle } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('fmh_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authApi.getMe();
      if (data.data.user) {
        setUser(data.data.user);
      } else {
        localStorage.removeItem('fmh_token');
        localStorage.removeItem('fmh_refresh_token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('fmh_token');
      localStorage.removeItem('fmh_refresh_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    const { user: u, accessToken, refreshToken } = data.data;
    localStorage.setItem('fmh_token', accessToken);
    localStorage.setItem('fmh_refresh_token', refreshToken);
    setUser(u);
    return u;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    const { user: u, accessToken, refreshToken } = data.data;
    localStorage.setItem('fmh_token', accessToken);
    localStorage.setItem('fmh_refresh_token', refreshToken);
    setUser(u);
    return u;
  };

  const loginWithGoogle = async () => {
    const idToken = await signInWithGoogle();
    const { data } = await authApi.googleLogin(idToken);
    const { user: u, accessToken } = data.data;
    localStorage.setItem('fmh_token', accessToken);
    localStorage.setItem('fmh_refresh_token', accessToken);
    setUser(u);
    return u;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('fmh_token');
    localStorage.removeItem('fmh_refresh_token');
    setUser(null);
  };

  const refreshUser = () => fetchMe();

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
