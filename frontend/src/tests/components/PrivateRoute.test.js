import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import PrivateRoute from '../../components/PrivateRoute';

// Mock the Navigate component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(() => <div data-testid="navigate-mock" />),
}));

describe('PrivateRoute Component', () => {
  it('should show loading indicator when loading is true', () => {
    // Mock loading state
    const contextValue = {
      isAuthenticated: false,
      loading: true,
    };
    
    render(
      <AuthContext.Provider value={contextValue}>
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      </AuthContext.Provider>
    );
    
    // Check that loading indicator is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Check that protected content is not shown
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
  
  it('should redirect to login when not authenticated', () => {
    // Mock unauthenticated state
    const contextValue = {
      isAuthenticated: false,
      loading: false,
    };
    
    render(
      <AuthContext.Provider value={contextValue}>
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      </AuthContext.Provider>
    );
    
    // Check that navigation to login happens
    expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    
    // Check that protected content is not shown
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
  
  it('should render children when authenticated', () => {
    // Mock authenticated state
    const contextValue = {
      isAuthenticated: true,
      loading: false,
    };
    
    render(
      <AuthContext.Provider value={contextValue}>
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      </AuthContext.Provider>
    );
    
    // Check that protected content is shown
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    
    // Check that loading indicator is not shown
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
  
  it('should work correctly with nested routes', () => {
    // Mock authenticated state
    const contextValue = {
      isAuthenticated: true,
      loading: false,
    };
    
    render(
      <AuthContext.Provider value={contextValue}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <div data-testid="layout">
                    <Routes>
                      <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
                    </Routes>
                  </div>
                </PrivateRoute>
              }
            />
            <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    // Check that protected content is shown
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });
}); 