import { createContext, useContext, useState } from 'react';
import { login as apiLogin, register as apiRegister } from '../utils/api';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('grandmascare_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('grandmascare_token') || '');

  const login = async (email, password) => {
    try {
      const { token: t, user: u } = await apiLogin(email, password);
      setUser(u);
      setToken(t);
      localStorage.setItem('grandmascare_user', JSON.stringify(u));
      localStorage.setItem('grandmascare_token', t);
      return { token: t, user: u };
    } catch (userErr) {
      try {
        const res = await fetch(`${API_BASE}/api/driver/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid credentials');
        const driverUser = {
          id: data.driver.id,
          name: data.driver.name,
          email: data.driver.email,
          phone: data.driver.phone,
          role: 'driver',
        };
        setUser(driverUser);
        setToken(data.token);
        localStorage.setItem('grandmascare_user', JSON.stringify(driverUser));
        localStorage.setItem('grandmascare_token', data.token);
        return { token: data.token, user: driverUser };
      } catch {
        throw userErr;
      }
    }
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
