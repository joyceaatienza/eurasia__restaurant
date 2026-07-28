import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Check localStorage on load so logged-in state persists on refresh
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('adminUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Dummy login handler
  const login = (role, name, password) => {
    // Basic mock check: simple validation rules for testing
    if (!name || !password) {
      return { success: false, message: 'Please fill in all fields.' };
    }

    const userData = { name, role: role || 'Admin' };

    // Save to state & localStorage
    setUser(userData);
    localStorage.setItem('adminUser', JSON.stringify(userData));
    return { success: true };
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    localStorage.removeItem('adminUser');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to easily use auth anywhere
export const useAuth = () => useContext(AuthContext);