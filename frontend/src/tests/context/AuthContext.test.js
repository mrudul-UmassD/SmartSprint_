import React from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { AuthProvider, AuthContext } from '../../context/AuthContext';

// Mock axios
jest.mock('axios');

describe('AuthContext', () => {
  // Setup localStorage mock
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key]),
      setItem: jest.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });
  
  it('should initialize with default values', async () => {
    // Create a test component that consumes the context
    const TestComponent = () => {
      const context = React.useContext(AuthContext);
      return (
        <div>
          <div data-testid="loading">{context.loading.toString()}</div>
          <div data-testid="isAuthenticated">{context.isAuthenticated.toString()}</div>
          <div data-testid="user">{JSON.stringify(context.user)}</div>
          <div data-testid="error">{context.error || 'no error'}</div>
        </div>
      );
    };
    
    // Render the component with the provider
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Check initial values
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('error').textContent).toBe('no error');
  });
  
  it('should load user when token exists', async () => {
    // Mock localStorage to have a token
    localStorageMock.setItem('token', 'test-token');
    
    // Mock axios.get to return user data
    axios.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'developer',
        },
      },
    });
    
    // Create a test component
    const TestComponent = () => {
      const context = React.useContext(AuthContext);
      return (
        <div>
          <div data-testid="loading">{context.loading.toString()}</div>
          <div data-testid="isAuthenticated">{context.isAuthenticated.toString()}</div>
          <div data-testid="user">{JSON.stringify(context.user)}</div>
        </div>
      );
    };
    
    // Render the component with the provider
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for the user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Check authentication state
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).not.toBe('null');
    expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/auth/me');
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer test-token');
  });
  
  it('should handle login successfully', async () => {
    // Mock axios.post for login
    axios.post.mockResolvedValueOnce({
      data: {
        token: 'new-token',
        data: {
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'developer',
          },
        },
      },
    });
    
    // Mock axios.get for loadUser
    axios.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'developer',
        },
      },
    });
    
    // Create a test component that calls login
    const TestComponent = () => {
      const { login, isAuthenticated, user, loading } = React.useContext(AuthContext);
      
      React.useEffect(() => {
        if (!isAuthenticated && !loading) {
          login('test@example.com', 'password123');
        }
      }, [login, isAuthenticated, loading]);
      
      return (
        <div>
          <div data-testid="loading">{loading.toString()}</div>
          <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
          <div data-testid="user">{JSON.stringify(user)}</div>
        </div>
      );
    };
    
    // Render the component with the provider
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    });
    
    // Check that the login was successful
    expect(screen.getByTestId('user').textContent).not.toBe('null');
    expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token');
  });
  
  it('should handle login failure', async () => {
    // Mock axios.post to reject
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    });
    
    // Create a component that captures login error
    let loginResult;
    const TestComponent = () => {
      const { login, error } = React.useContext(AuthContext);
      
      React.useEffect(() => {
        const doLogin = async () => {
          loginResult = await login('wrong@example.com', 'wrongpassword');
        };
        doLogin();
      }, [login]);
      
      return <div data-testid="error">{error || 'no error'}</div>;
    };
    
    // Render the component
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for login to fail
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Invalid credentials');
    });
    
    // Check that login returned failure
    expect(loginResult).toEqual({ success: false, error: 'Invalid credentials' });
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });
  
  it('should handle logout', async () => {
    // Mock initial authenticated state
    localStorageMock.setItem('token', 'test-token');
    axios.defaults.headers.common['Authorization'] = 'Bearer test-token';
    
    // Mock user data retrieval
    axios.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'developer',
        },
      },
    });
    
    // Create a component that logs out
    const TestComponent = () => {
      const { logout, isAuthenticated, loading } = React.useContext(AuthContext);
      
      return (
        <div>
          <div data-testid="loading">{loading.toString()}</div>
          <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
          <button data-testid="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      );
    };
    
    // Render the component
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial load
    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('false');
    });
    
    // Check initial authenticated state
    expect(getByTestId('isAuthenticated').textContent).toBe('true');
    
    // Trigger logout
    await act(async () => {
      getByTestId('logout-btn').click();
    });
    
    // Check that the user is logged out
    expect(getByTestId('isAuthenticated').textContent).toBe('false');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
  });
}); 