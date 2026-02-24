import { createContext, useContext, useState } from 'react';
import { login as apiLogin, register as apiRegister } from '../utils/api';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('grandmascare_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('grandmascare_token') || '');

  const login = async (email, password) => {
    const { token: t, user: u } = await apiLogin(email, password);
    setUser(u);
    setToken(t);
    localStorage.setItem('grandmascare_user', JSON.stringify(u));
    localStorage.setItem('grandmascare_token', t);
    return { token: t, user: u };
  };

  const register = async (name, email, phone, password) => {
    const { token: t, user: u } = await apiRegister(name, email, phone, password);
    setUser(u);
    setToken(t);
    localStorage.setItem('grandmascare_user', JSON.stringify(u));
    localStorage.setItem('grandmascare_token', t);
    return { token: t, user: u };
  };

  const adminLogin = async (email, password) => {
    const { token: t, user: u } = await apiLogin(email, password);
    if (u.role !== 'admin') {
      throw new Error('Not an admin account');
    }
    setUser(u);
    setToken(t);
    localStorage.setItem('grandmascare_user', JSON.stringify(u));
    localStorage.setItem('grandmascare_token', t);
    return { token: t, user: u };
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('grandmascare_user');
    localStorage.removeItem('grandmascare_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { AuthProvider, useAuth };
