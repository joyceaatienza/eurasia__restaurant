import React, { createContext, useContext, useState, useEffect } from 'react';
import { customerAuthApi } from '../services/customerAuthApi';

const AuthContext = createContext();

const TOKEN_KEY = 'eurasia_customer_token';
const USER_KEY = 'eurasia_customer';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  // Confirm the saved session is still valid on load
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    customerAuthApi
      .me(token)
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  const saveSession = ({ token: newToken, customer }) => {
    setToken(newToken);
    setUser(customer);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(customer));
  };

  const register = async (payload) => {
    const data = await customerAuthApi.register(payload);
    saveSession(data);
    return data.customer;
  };

  const login = async (payload) => {
    const data = await customerAuthApi.login(payload);
    saveSession(data);
    return data.customer;
  };

    const updateProfile = async (payload) => {
    const updated = await customerAuthApi.updateProfile(token, payload);
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  };

  const changePassword = async (payload) => {
    return customerAuthApi.changePassword(token, payload);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated: !!user, register, login, logout, updateProfile, changePassword }}    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);