const request = require('supertest');
const jwt = require('jsonwebtoken');
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Mock User model and auth middleware
jest.mock('../models/User');
jest.mock('../middleware/auth');

// Create express app and routes for testing
const app = express();
app.use(express.json());
require('../routes/users')(app);

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth middleware mock to allow requests
    auth.mockImplementation((req, res, next) => {
      req.user = { id: 1 };
      next();
    });
    
    // Default roleCheck middleware mock to allow requests
    auth.roleCheck = jest.fn().mockImplementation(() => (req, res, next) => {
      next();
    });
  });

  describe('GET /api/users', () => {
    it('should get all users with admin role', async () => {
      // Mock User.findAll to return users
      User.findAll.mockResolvedValue([
        { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
        { id: 2, name: 'Manager User', email: 'manager@example.com', role: 'project_manager' },
      ]);

      const res = await request(app)
        .get('/api/users')
        .set('x-auth-token', 'valid-token');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(auth.roleCheck).toHaveBeenCalledWith(['admin', 'project_manager']);
    });

    it('should return 401 for unauthorized users', async () => {
      // Mock roleCheck to deny access
      auth.roleCheck = jest.fn().mockImplementation(() => (req, res, next) => {
        return res.status(401).json({ msg: 'Not authorized' });
      });

      const res = await request(app)
        .get('/api/users')
        .set('x-auth-token', 'valid-token');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get a user by ID for admin user', async () => {
      // Mock User.findById to return a user
      User.findById.mockResolvedValue({
        id: 2,
        name: 'Test User',
        email: 'test@example.com',
        role: 'developer',
        toJSON: () => ({
          id: 2,
          name: 'Test User',
          email: 'test@example.com',
          role: 'developer'
        })
      });

      // Set user to be admin
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'admin' };
        next();
      });

      const res = await request(app)
        .get('/api/users/2')
        .set('x-auth-token', 'valid-token');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', 2);
    });

    it('should allow users to get their own data', async () => {
      // Mock User.findById to return a user
      User.findById.mockResolvedValue({
        id: 1,
        name: 'Self User',
        email: 'self@example.com',
        role: 'developer',
        toJSON: () => ({
          id: 1,
          name: 'Self User',
          email: 'self@example.com',
          role: 'developer'
        })
      });

      // Set user to be the same as requested
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'developer' };
        next();
      });

      const res = await request(app)
        .get('/api/users/1')
        .set('x-auth-token', 'valid-token');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', 1);
    });

    it('should return 403 for non-admin trying to access other users', async () => {
      // Set user to be developer
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'developer' };
        next();
      });

      const res = await request(app)
        .get('/api/users/2')
        .set('x-auth-token', 'valid-token');

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('POST /api/users', () => {
    it('should allow admin to create any user', async () => {
      // Mock User.findByEmail to return null (user doesn't exist)
      User.findByEmail.mockResolvedValue(null);
      
      // Mock User.canCreateUser to return true
      User.canCreateUser.mockReturnValue(true);
      
      // Mock User.createByUser to create a user
      User.createByUser.mockResolvedValue({
        id: 3,
        name: 'New Admin',
        email: 'newadmin@example.com',
        role: 'admin'
      });

      // Set user to be admin
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'admin' };
        next();
      });

      const res = await request(app)
        .post('/api/users')
        .set('x-auth-token', 'valid-token')
        .send({
          name: 'New Admin',
          email: 'newadmin@example.com',
          password: 'password123',
          role: 'admin'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id', 3);
      expect(res.body).toHaveProperty('role', 'admin');
      expect(User.createByUser).toHaveBeenCalled();
      expect(User.createByUser.mock.calls[0][1]).toEqual('admin');
    });

    it('should allow project_manager to create developer users', async () => {
      // Mock User.findByEmail to return null (user doesn't exist)
      User.findByEmail.mockResolvedValue(null);
      
      // Mock User.canCreateUser to return true
      User.canCreateUser.mockReturnValue(true);
      
      // Mock User.createByUser to create a user
      User.createByUser.mockResolvedValue({
        id: 3,
        name: 'New Developer',
        email: 'newdev@example.com',
        role: 'developer'
      });

      // Set user to be project_manager
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'project_manager' };
        next();
      });

      const res = await request(app)
        .post('/api/users')
        .set('x-auth-token', 'valid-token')
        .send({
          name: 'New Developer',
          email: 'newdev@example.com',
          password: 'password123',
          role: 'developer'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id', 3);
      expect(res.body).toHaveProperty('role', 'developer');
      expect(User.createByUser).toHaveBeenCalled();
      expect(User.createByUser.mock.calls[0][1]).toEqual('project_manager');
    });

    it('should not allow project_manager to create admin users', async () => {
      // Mock User.findByEmail to return null (user doesn't exist)
      User.findByEmail.mockResolvedValue(null);
      
      // Mock User.canCreateUser to return false
      User.canCreateUser.mockReturnValue(false);

      // Set user to be project_manager
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'project_manager' };
        next();
      });

      const res = await request(app)
        .post('/api/users')
        .set('x-auth-token', 'valid-token')
        .send({
          name: 'New Admin',
          email: 'newadmin@example.com',
          password: 'password123',
          role: 'admin'
        });

      expect(res.statusCode).toEqual(403);
      expect(User.createByUser).not.toHaveBeenCalled();
    });

    it('should not allow developer to create users', async () => {
      // Set user to be developer
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'developer' };
        next();
      });

      // Mock roleCheck to deny access
      auth.roleCheck = jest.fn().mockImplementation(() => (req, res, next) => {
        return res.status(401).json({ msg: 'Not authorized' });
      });

      const res = await request(app)
        .post('/api/users')
        .set('x-auth-token', 'valid-token')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'viewer'
        });

      expect(res.statusCode).toEqual(401);
      expect(User.createByUser).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/users/change-password', () => {
    it('should allow user to change their own password', async () => {
      // Mock User.findById to return a user
      User.findById.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        updatePassword: jest.fn().mockResolvedValue(true)
      });

      // Set user to be the one changing password
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      const res = await request(app)
        .post('/api/users/change-password')
        .set('x-auth-token', 'valid-token')
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(res.statusCode).toEqual(200);
      expect(User.findById).toHaveBeenCalledWith(1);
      expect(User.findById().updatePassword).toHaveBeenCalledWith('oldpassword', 'newpassword123');
    });

    it('should return 400 if passwords do not match', async () => {
      // Set user to be the one changing password
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      const res = await request(app)
        .post('/api/users/change-password')
        .set('x-auth-token', 'valid-token')
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'differentpassword'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
      expect(User.findById).not.toHaveBeenCalled();
    });

    it('should return 401 if current password is incorrect', async () => {
      // Mock User.findById to return a user
      User.findById.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        updatePassword: jest.fn().mockResolvedValue(false)
      });

      // Set user to be the one changing password
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      const res = await request(app)
        .post('/api/users/change-password')
        .set('x-auth-token', 'valid-token')
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('msg', 'Current password is incorrect');
      expect(User.findById).toHaveBeenCalledWith(1);
      expect(User.findById().updatePassword).toHaveBeenCalledWith('wrongpassword', 'newpassword123');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should allow admin to update any user', async () => {
      // Mock User.findById to return a user
      User.findById.mockResolvedValue({
        id: 2,
        name: 'Test User',
        email: 'test@example.com',
        role: 'developer',
        update: jest.fn().mockResolvedValue({
          id: 2,
          name: 'Updated User',
          email: 'test@example.com',
          role: 'project_manager'
        })
      });

      // Set user to be admin
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'admin' };
        next();
      });

      const res = await request(app)
        .put('/api/users/2')
        .set('x-auth-token', 'valid-token')
        .send({
          name: 'Updated User',
          role: 'project_manager'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('name', 'Updated User');
      expect(res.body).toHaveProperty('role', 'project_manager');
      expect(User.findById).toHaveBeenCalledWith('2');
      expect(User.findById().update).toHaveBeenCalled();
    });

    it('should allow user to update their own data except role', async () => {
      // Mock User.findById to return a user
      User.findById.mockResolvedValue({
        id: 1,
        name: 'Self User',
        email: 'self@example.com',
        role: 'developer',
        bio: '',
        update: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Updated Self',
          email: 'self@example.com',
          role: 'developer',
          bio: 'New bio'
        })
      });

      // Set user to be the same as being updated
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'developer' };
        next();
      });

      const res = await request(app)
        .put('/api/users/1')
        .set('x-auth-token', 'valid-token')
        .send({
          name: 'Updated Self',
          bio: 'New bio',
          role: 'admin' // This should be ignored
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('name', 'Updated Self');
      expect(res.body).toHaveProperty('bio', 'New bio');
      expect(res.body).toHaveProperty('role', 'developer'); // Role should not change
      expect(User.findById).toHaveBeenCalledWith('1');
      expect(User.findById().update).toHaveBeenCalled();
      
      // Validate that role was not included in the update
      const updateArgs = User.findById().update.mock.calls[0][0];
      expect(updateArgs).not.toHaveProperty('role');
    });

    it('should return 403 for non-admin trying to update other users', async () => {
      // Set user to be developer
      auth.mockImplementation((req, res, next) => {
        req.user = { id: 1, role: 'developer' };
        next();
      });

      const res = await request(app)
        .put('/api/users/2')
        .set('x-auth-token', 'valid-token')
        .send({
          name: 'Hacked User',
          role: 'admin'
        });

      expect(res.statusCode).toEqual(403);
      expect(User.findById().update).not.toHaveBeenCalled();
    });
  });
}); 