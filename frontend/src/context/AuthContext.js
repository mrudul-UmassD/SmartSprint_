import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// API URL
const API_URL = 'http://localhost:5000/api';

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  
  // Set auth token
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };
  
  // Load user data from token
  const loadUser = async () => {
    setLoading(true);
    setError(null);
    
    // If no token, user is not authenticated
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    
    try {
      // Set token in headers
      setAuthToken(token);
      
      // Fetch user data
      const res = await axios.get(`${API_URL}/auth/me`);
      
      // Set user data
      setUser(res.data.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err.response?.data?.message || 'An error occurred');
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      setAuthToken(null);
    }
    
    setLoading(false);
  };
  
  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post(`${API_URL}/auth/register`, userData);
      
      // Set token
      const receivedToken = res.data.token;
      setToken(receivedToken);
      setAuthToken(receivedToken);
      
      // Load user data
      await loadUser();
      
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // Login user
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      // Set token
      const receivedToken = res.data.token;
      setToken(receivedToken);
      setAuthToken(receivedToken);
      
      // Load user data
      await loadUser();
      
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Invalid credentials';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // Logout user
  const logout = () => {
    setToken(null);
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };
  
  // Update user
  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };
  
  // Check if user is admin
  const isAdmin = user?.role === 'Admin';
  
  // Load user on first render if token exists
  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        token,
        register,
        login,
        logout,
        updateUser,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 