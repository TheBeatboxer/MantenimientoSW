import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState(null);

  // Configurar axios con interceptores
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Interceptor para manejar respuestas 401
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/admin/login', {
        username,
        password
      });

      const { token, user: userData, csrfToken: csrf } = response.data;
      
      localStorage.setItem('admin_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      setCsrfToken(csrf);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al iniciar sesión'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setCsrfToken(null);
  };

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setLoading(false);
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/api/admin/profile');

      setUser(response.data.user);
      setLoading(false);
    } catch (error) {
      console.error('Error checking auth:', error);
      logout();
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth, logout]);

  const value = {
    user,
    login,
    logout,
    loading,
    csrfToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
