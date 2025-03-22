import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// API URL
const API_URL = 'http://localhost:5000/api';

// Create context
export const AuthContext = createContext();

// Set auth token for axios requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set token in axios and local storage
  useEffect(() => {
    if (token) {
      setAuthToken(token);
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Load user data from token
  const loadUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/auth/user`);
      
      if (res.data.success) {
        setUser(res.data.user);
        setIsAuthenticated(true);
      } else {
        // If the response has success: false, clear authentication
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading user:', err);
      
      // Clear auth state on error
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      
      // Handle 401 errors
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please login again.');
      }
    }
  };

  // Register user
  const register = async (name, email, password, role = 'developer') => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        role
      });
      
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error(res.data.message || 'Registration failed');
      }
      
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.errors?.[0]?.msg || 
        err.message || 
        'Registration failed';
      
      setError(errorMessage);
      throw err;
    }
  };

  // Login user
  const login = async (emailOrUsername, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: emailOrUsername,
        password
      });
      
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error(res.data.message || 'Login failed');
      }
      
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.errors?.[0]?.msg || 
        err.message || 
        'Login failed';
      
      setError(errorMessage);
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user data
  const updateUser = (updatedUser) => {
    setUser({ ...user, ...updatedUser });
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Check if user is project manager
  const isProjectManager = () => {
    return user && (user.role === 'admin' || user.role === 'project_manager');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        register,
        login,
        logout,
        loadUser,
        updateUser,
        isAdmin,
        isProjectManager
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 