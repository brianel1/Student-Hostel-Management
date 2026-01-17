import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem('kktm_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.id && parsed.role) {
            setUser(parsed);
          } else {
            localStorage.removeItem('kktm_user');
          }
        }
      } catch (e) {
        console.error('Auth init error:', e);
        localStorage.removeItem('kktm_user');
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('kktm_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kktm_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
