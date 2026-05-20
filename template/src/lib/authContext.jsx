import React, { createContext, useContext, useState, useEffect } from 'react';

const AppAuthContext = createContext(null);

export function AppAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('kampungkaki_user');
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem('kampungkaki_user', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kampungkaki_user');
  };

  const switchRole = (newRole) => {
    const updated = { ...currentUser, active_role: newRole };
    setCurrentUser(updated);
    localStorage.setItem('kampungkaki_user', JSON.stringify(updated));
  };

  return (
    <AppAuthContext.Provider value={{ currentUser, isLoading, login, logout, switchRole }}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  return useContext(AppAuthContext);
}