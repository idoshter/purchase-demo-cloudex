import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = () => {
    setIsLoadingAuth(true);
    const storedGoogleUser = localStorage.getItem('googleUser');
    if (storedGoogleUser) {
      try {
        setUser(JSON.parse(storedGoogleUser));
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('googleUser');
      }
    }
    setIsLoadingAuth(false);
  };

  const loginWithGoogle = (googleUser) => {
    setUser(googleUser);
    setIsAuthenticated(true);
    localStorage.setItem('googleUser', JSON.stringify(googleUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('googleUser');
    window.location.href = '/';
  };

  const navigateToLogin = () => {
    // For now, redirect to home which should show login if not authenticated
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      logout,
      navigateToLogin,
      loginWithGoogle,
      checkAppState: checkUserAuth // Backward compatibility alias
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
