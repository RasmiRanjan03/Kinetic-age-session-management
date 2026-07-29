import React, { createContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [clientId, setClientId] = useState(localStorage.getItem('clientId') || null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Authenticate user on page load if token is in localStorage
  useEffect(() => {
    const loadCurrentUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await getMe();
          if (response.success && response.data) {
            setUser(response.data);
            setToken(storedToken);
            setRole(response.data.role);
            setClientId(response.data.clientId);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('clientId', response.data.clientId);
          } else {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('clientId');
            setToken(null);
            setRole(null);
            setClientId(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to authenticate stored session token:', error.message);
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('clientId');
          setToken(null);
          setRole(null);
          setClientId(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadCurrentUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginUser(email, password);
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('clientId', response.data.clientId);
        setToken(response.token);
        setRole(response.data.role);
        setClientId(response.data.clientId);
        setUser(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Login action error:', error.message);
      return null;
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerUser(userData);
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('clientId', response.data.clientId);
        setToken(response.token);
        setRole(response.data.role);
        setClientId(response.data.clientId);
        setUser(response.data);
        return { success: true };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      console.error('Registration action error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'An error occurred during account creation' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('clientId');
    setToken(null);
    setRole(null);
    setClientId(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const response = await getMe();
        if (response.success && response.data) {
          setUser(response.data);
          setRole(response.data.role);
          setClientId(response.data.clientId);
          localStorage.setItem('role', response.data.role);
          localStorage.setItem('clientId', response.data.clientId);
        }
      } catch (error) {
        console.error('Failed to refresh user:', error.message);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, role, clientId, isAuthenticated, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
