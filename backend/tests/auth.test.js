const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Mock dependencies
jest.mock('../models/User');
jest.mock('../middleware/auth', () => ({
  authMiddleware: jest.fn((req, res, next) => next()),
  generateToken: jest.fn(() => 'mock-token'),
}));

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Routes', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock User.findByEmail to return null (user doesn't exist)
      User.findByEmail.mockResolvedValue(null);
      
      // Mock User.create to return an ID
      User.create.mockResolvedValue({ id: 1 });
      
      // Mock User.findById to return a new user
      User.findById.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'developer',
        toJSON: () => ({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'developer',
        }),
      });
      
      // Test the endpoint
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      
      // Assertions
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('token');
      expect(User.create).toHaveBeenCalledWith('Test User', 'test@example.com', 'password123', 'developer');
    });

    it('should return 400 if user already exists', async () => {
      // Mock User.findByEmail to return a user (user exists)
      User.findByEmail.mockResolvedValue({
        id: 1,
        name: 'Existing User',
        email: 'existing@example.com',
      });
      
      // Test the endpoint
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
        });
      
      // Assertions
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      // Test the endpoint with missing fields
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          // Missing email
          password: 'password123',
        });
      
      // Assertions
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(User.findByEmail).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user successfully', async () => {
      // Mock user with comparePassword method
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(true),
        toJSON: () => ({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'developer',
        }),
      };
      
      // Mock User.findByEmail to return our mock user
      User.findByEmail.mockResolvedValue(mockUser);
      
      // Test the endpoint
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      // Assertions
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('token');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(generateToken).toHaveBeenCalledWith(mockUser);
    });

    it('should return 401 if user does not exist', async () => {
      // Mock User.findByEmail to return null (user doesn't exist)
      User.findByEmail.mockResolvedValue(null);
      
      // Test the endpoint
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });
      
      // Assertions
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      // Mock user with comparePassword method that returns false
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      
      // Mock User.findByEmail to return our mock user
      User.findByEmail.mockResolvedValue(mockUser);
      
      // Test the endpoint
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      
      // Assertions
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
    });

    it('should return 400 if required fields are missing', async () => {
      // Test the endpoint with missing fields
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          // Missing password
        });
      
      // Assertions
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(User.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return the current user', async () => {
      // Create mock request with user
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'developer',
        toJSON: () => ({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'developer',
        }),
      };
      
      // Mock the middleware to set req.user
      app.use('/api/auth/me', (req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      // Test the endpoint
      const res = await request(app).get('/api/auth/me');
      
      // Assertions
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).toEqual(mockUser.toJSON());
    });
  });
}); 